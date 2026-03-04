import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PaymentInitRequest {
  userId: string;
  amount: number;
  phoneNumber: string;
  userName: string;
  callbackPageUrl?: string;
}

function formatPhoneForPesapal(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("254")) return cleaned;
  if (cleaned.startsWith("07") || cleaned.startsWith("01")) return "254" + cleaned.substring(1);
  if (cleaned.startsWith("7") || cleaned.startsWith("1")) return "254" + cleaned;
  return "";
}

function generateMerchantReference(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `HUG-${userId.substring(0, 8)}-${timestamp}-${random}`.toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const pesapalKey = Deno.env.get("PESAPAL_CONSUMER_KEY");
    const pesapalSecret = Deno.env.get("PESAPAL_CONSUMER_SECRET");

    if (!supabaseUrl || !supabaseServiceRoleKey) throw new Error("Supabase configuration missing");
    if (!pesapalKey || !pesapalSecret) throw new Error("Pesapal credentials not configured.");

    const { userId, amount, phoneNumber, userName, callbackPageUrl } = (await req.json()) as PaymentInitRequest;

    if (!userId || !amount || !phoneNumber || !userName) throw new Error("Missing required fields");

    const formattedPhone = formatPhoneForPesapal(phoneNumber);
    if (!formattedPhone || formattedPhone.length !== 12) throw new Error("Invalid phone number format");

    const merchantReference = generateMerchantReference(userId);
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Store payment transaction
    const { data: paymentRecord, error: dbError } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: userId,
        merchant_reference: merchantReference,
        amount: amount,
        phone_number: formattedPhone,
        status: "pending",
      })
      .select()
      .single();

    if (dbError) throw new Error(`Failed to create payment record: ${dbError.message}`);

    console.log("Payment record created:", paymentRecord.id);

    // Step 1: Get auth token
    const tokenResponse = await fetch("https://pay.pesapal.com/v3/api/Auth/RequestToken", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ consumer_key: pesapalKey, consumer_secret: pesapalSecret }),
    });
    const tokenResult = await tokenResponse.json();
    if (!tokenResponse.ok || tokenResult.error) throw new Error(`Pesapal auth failed: ${tokenResult.error?.message || tokenResponse.statusText}`);
    const authToken = tokenResult.token;

    // Step 2: Register IPN
    const ipnUrl = `${supabaseUrl}/functions/v1/pesapal-callback`;
    const ipnResponse = await fetch("https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${authToken}` },
      body: JSON.stringify({ url: ipnUrl, ipn_notification_type: "POST" }),
    });
    const ipnResult = await ipnResponse.json();
    const notificationId = ipnResult.ipn_id;

    // Step 3: Submit order - use callbackPageUrl to redirect back to app
    const redirectBackUrl = callbackPageUrl || `${supabaseUrl}/functions/v1/pesapal-callback`;
    
    const orderResponse = await fetch("https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Bearer ${authToken}` },
      body: JSON.stringify({
        id: merchantReference,
        currency: "KES",
        amount: amount,
        description: `Daily contribution from ${userName}`,
        callback_url: redirectBackUrl,
        notification_id: notificationId,
        billing_address: {
          phone_number: formattedPhone,
          first_name: userName,
          email_address: `user-${userId.substring(0, 8)}@horizon-unity.local`,
        },
      }),
    });

    const orderResult = await orderResponse.json();
    console.log("Order result:", JSON.stringify(orderResult));

    if (!orderResponse.ok || orderResult.error) {
      throw new Error(`Pesapal order error: ${orderResult.error?.message || orderResponse.statusText}`);
    }

    // Update with tracking ID
    if (orderResult.order_tracking_id) {
      await supabase
        .from("payment_transactions")
        .update({ pesapal_transaction_id: orderResult.order_tracking_id })
        .eq("id", paymentRecord.id);
    }

    return new Response(JSON.stringify({
      success: true,
      reference: merchantReference,
      redirectUrl: orderResult.redirect_url || null,
      message: "Payment initiated successfully.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

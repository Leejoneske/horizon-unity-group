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
}

interface PaymentResponse {
  success: boolean;
  reference?: string;
  error?: string;
  message?: string;
}

function formatPhoneForPesapal(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("254")) {
    return cleaned;
  } else if (cleaned.startsWith("07") || cleaned.startsWith("01")) {
    return "254" + cleaned.substring(1);
  } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    return "254" + cleaned;
  }
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

    console.log("Environment check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!supabaseServiceRoleKey,
      hasPesapalKey: !!pesapalKey,
      hasPesapalSecret: !!pesapalSecret,
    });

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase configuration missing");
    }

    if (!pesapalKey || !pesapalSecret) {
      throw new Error("Pesapal credentials not configured. Please add PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET.");
    }

    // Parse request
    const { userId, amount, phoneNumber, userName } = (await req.json()) as PaymentInitRequest;

    console.log("Received payment request:", { userId, amount, phoneNumber, userName });

    if (!userId || !amount || !phoneNumber || !userName) {
      throw new Error("Missing required fields");
    }

    const formattedPhone = formatPhoneForPesapal(phoneNumber);
    if (!formattedPhone || formattedPhone.length !== 12) {
      throw new Error("Invalid phone number format");
    }

    const merchantReference = generateMerchantReference(userId);

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Store payment transaction record
    console.log("Creating payment transaction...");
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

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Failed to create payment record: ${dbError.message}`);
    }

    console.log("Payment record created:", paymentRecord);

    // Step 1: Get Pesapal auth token
    const tokenUrl = "https://pay.pesapal.com/v3/api/Auth/RequestToken";
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        consumer_key: pesapalKey,
        consumer_secret: pesapalSecret,
      }),
    });

    const tokenResult = await tokenResponse.json();
    console.log("Token response status:", tokenResponse.status);

    if (!tokenResponse.ok || tokenResult.error) {
      throw new Error(`Pesapal auth failed: ${tokenResult.error?.message || tokenResponse.statusText}`);
    }

    const authToken = tokenResult.token;

    // Step 2: Register IPN URL
    const ipnUrl = `${supabaseUrl}/functions/v1/pesapal-callback`;
    const ipnResponse = await fetch("https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: "POST",
      }),
    });

    const ipnResult = await ipnResponse.json();
    console.log("IPN registration:", ipnResult);

    const notificationId = ipnResult.ipn_id;

    // Step 3: Submit order
    const orderResponse = await fetch("https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        id: merchantReference,
        currency: "KES",
        amount: amount,
        description: `Daily contribution from ${userName}`,
        callback_url: `${supabaseUrl}/functions/v1/pesapal-callback`,
        notification_id: notificationId,
        billing_address: {
          phone_number: formattedPhone,
          first_name: userName,
          email_address: `user-${userId.substring(0, 8)}@horizon-unity.local`,
        },
      }),
    });

    const orderResult = await orderResponse.json();
    console.log("Order submission result:", orderResult);

    if (!orderResponse.ok || orderResult.error) {
      throw new Error(`Pesapal order error: ${orderResult.error?.message || orderResponse.statusText}`);
    }

    // Update payment record with tracking ID
    if (orderResult.order_tracking_id) {
      await supabase
        .from("payment_transactions")
        .update({ pesapal_transaction_id: orderResult.order_tracking_id })
        .eq("id", paymentRecord.id);
    }

    const response: PaymentResponse = {
      success: true,
      reference: merchantReference,
      message: "Payment initiated successfully. Check your phone for M-Pesa prompt.",
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in initiate-pesapal-payment:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    const response: PaymentResponse = {
      success: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

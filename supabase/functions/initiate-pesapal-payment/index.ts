import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const pesapalKey = Deno.env.get("VITE_PESAPAL_CONSUMER_KEY");
    const pesapalSecret = Deno.env.get("VITE_PESAPAL_CONSUMER_SECRET");

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
      throw new Error("Pesapal credentials not configured");
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

    // Prepare Pesapal request data
    const pesapalUrl = "https://cybqa.pesapal.com/pesapalapi/api/merchants/InitiatePayment";
    const paymentData = new URLSearchParams({
      consumer_key: pesapalKey,
      consumer_secret: pesapalSecret,
      amount: amount.toString(),
      currency: "KES",
      description: `Daily contribution from ${userName}`,
      reference: merchantReference,
      first_name: userName,
      phone_number: formattedPhone,
      email: `user-${userId}@horizon-unity.local`,
      pesapal_notification_url: `${supabaseUrl}/functions/v1/pesapal-callback`,
      transaction_type: "PAYMENT",
    });

    console.log("Calling Pesapal API...");
    const pesapalResponse = await fetch(pesapalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: paymentData.toString(),
    });

    console.log("Pesapal response status:", pesapalResponse.status);
    const pesapalText = await pesapalResponse.text();
    console.log("Pesapal response text:", pesapalText);

    if (!pesapalResponse.ok) {
      throw new Error(`Pesapal API error: ${pesapalResponse.status} - ${pesapalText}`);
    }

    // Try to parse as JSON
    let pesapalResult;
    try {
      pesapalResult = JSON.parse(pesapalText);
    } catch {
      // If not JSON, treat as success if status 200
      pesapalResult = { status: "200", message: pesapalText };
    }

    console.log("Pesapal result:", pesapalResult);

    // Check for success
    if (pesapalResult.status !== "200" && pesapalResult.status !== 200) {
      throw new Error(`Pesapal error: ${pesapalResult.error || "Unknown error"}`);
    }

    const response: PaymentResponse = {
      success: true,
      reference: merchantReference,
      message: "Payment initiated successfully",
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

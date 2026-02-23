import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.182.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Types
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
}

// Utility function to generate OAuth signature
function generateOAuthSignature(
  method: string,
  url: string,
  data: Record<string, string>,
  consumerKey: string,
  consumerSecret: string
): string {
  // Create base string for HMAC
  const baseString = method + url + JSON.stringify(data).split("").sort().join("");

  // Create signing key
  const signingKey = consumerSecret + "&";

  // Generate HMAC SHA1
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(signingKey);
  const dataBuffer = encoder.encode(baseString);

  // Use SubtleCrypto for HMAC-SHA1
  return crypto.subtle
    .sign("HMAC", keyBuffer, dataBuffer)
    .then((signature: ArrayBuffer) => {
      // Convert to base64
      const bytes = new Uint8Array(signature);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    });
}

// Format phone number to Pesapal format (254XXXXXXXXX)
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

// Generate merchant reference
function generateMerchantReference(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `HUG-${userId.substring(0, 8)}-${timestamp}-${random}`.toUpperCase();
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const pesapalKey = Deno.env.get("VITE_PESAPAL_CONSUMER_KEY");
    const pesapalSecret = Deno.env.get("VITE_PESAPAL_CONSUMER_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!pesapalKey || !pesapalSecret) {
      throw new Error("Pesapal credentials not configured");
    }

    // Parse request
    const { userId, amount, phoneNumber, userName } = (await req.json()) as PaymentInitRequest;

    if (!userId || !amount || !phoneNumber || !userName) {
      throw new Error("Missing required fields: userId, amount, phoneNumber, userName");
    }

    // Format phone number
    const formattedPhone = formatPhoneForPesapal(phoneNumber);
    if (!formattedPhone || formattedPhone.length !== 12) {
      throw new Error("Invalid phone number format");
    }

    // Generate merchant reference
    const merchantReference = generateMerchantReference(userId);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

    // Store payment transaction record
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

    // Prepare Pesapal request data
    const pesapalUrl = "https://cybqa.pesapal.com/pesapalapi/api/merchants/InitiatePayment";
    const paymentData = {
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
    };

    console.log("Initiating Pesapal payment:", {
      amount,
      reference: merchantReference,
      phone: formattedPhone,
    });

    // Call Pesapal API
    const pesapalResponse = await fetch(pesapalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(paymentData).toString(),
    });

    if (!pesapalResponse.ok) {
      const errorText = await pesapalResponse.text();
      console.error("Pesapal API error:", errorText);
      throw new Error(`Pesapal API error: ${pesapalResponse.status}`);
    }

    const pesapalResult = await pesapalResponse.json();

    console.log("Pesapal response:", pesapalResult);

    // Check for success
    if (pesapalResult.status !== "200") {
      throw new Error(`Pesapal error: ${pesapalResult.error || "Unknown error"}`);
    }

    // Return success response
    const response: PaymentResponse = {
      success: true,
      reference: merchantReference,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in initiate-pesapal-payment:", error);

    const response: PaymentResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

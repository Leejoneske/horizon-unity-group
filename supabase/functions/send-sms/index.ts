import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.0";

// TextLocal API Configuration - from environment variables
const TEXTLOCAL_API_KEY = Deno.env.get("TEXTLOCAL_API_KEY");
const TEXTLOCAL_API_URL = "https://api.textlocal.in/send/";

interface SMSPayload {
  phoneNumber: string;
  message: string;
  userId: string;
  messageType: string;
}

// Format phone number for different countries
const formatPhoneNumber = (phoneNumber: string): string | null => {
  // Remove all non-digits
  const cleanNumber = phoneNumber.replace(/\D/g, "");
  
  if (!cleanNumber || cleanNumber.length < 9) {
    console.error("Invalid phone number format:", phoneNumber);
    return null;
  }

  // Check if country code already present
  if (cleanNumber.startsWith("254")) {
    // Kenya - valid
    return cleanNumber;
  } else if (cleanNumber.startsWith("91")) {
    // India - valid
    return cleanNumber;
  } else if (cleanNumber.startsWith("1") && cleanNumber.length === 11) {
    // USA/Canada - valid (1 + 10 digits)
    return cleanNumber;
  } else {
    // Default to Kenya (254) if no country code detected
    let formatted = cleanNumber;
    if (formatted.startsWith("0")) {
      formatted = formatted.substring(1);
    }
    
    // Expected lengths for Kenya are 9 or 10 digits (without country code)
    if (formatted.length === 9 || formatted.length === 10) {
      return "254" + formatted;
    }
    
    // If it's 10 digits starting with 7, 1, or 2 (common Kenya prefixes), assume Kenya
    if (formatted.length === 10 && ["7", "1", "2"].includes(formatted.charAt(0))) {
      return "254" + formatted;
    }
    
    console.error("Could not determine country code for:", phoneNumber);
    return null;
  }
};

const sendViaTextLocal = async (
  phoneNumber: string,
  message: string
): Promise<boolean> => {
  try {
    // Check if API key is configured
    if (!TEXTLOCAL_API_KEY) {
      console.error("TextLocal API key not configured");
      return false;
    }

    const formattedNumber = formatPhoneNumber(phoneNumber);
    if (!formattedNumber) {
      console.error("Failed to format phone number:", phoneNumber);
      return false;
    }

    // Create request body for TextLocal
    const params = new URLSearchParams();
    params.append("apikey", TEXTLOCAL_API_KEY);
    params.append("numbers", formattedNumber);
    params.append("message", message);
    params.append("sender", "HORIZON");

    const response = await fetch(TEXTLOCAL_API_URL, {
      method: "POST",
      body: params,
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("TextLocal API Error:", data);
      return false;
    }

    console.log("SMS sent successfully via TextLocal:", data);
    return true;
  } catch (error) {
    console.error("TextLocal error:", error);
    return false;
  }
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const payload: SMSPayload = await req.json();

    const { phoneNumber, message, userId, messageType } = payload;

    if (!phoneNumber || !message || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if SMS service is configured
    if (!TEXTLOCAL_API_KEY) {
      console.warn("SMS service not configured - API key missing");
      // Still log the attempt even if SMS is not available
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabase.from("sms_logs").insert({
        user_id: userId,
        phone_number: phoneNumber,
        message,
        message_type: messageType,
        status: "failed",
      }).catch(err => console.error("Failed to log SMS:", err));

      return new Response(
        JSON.stringify({ error: "SMS service not available" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Send SMS via TextLocal
    const success = await sendViaTextLocal(phoneNumber, message);

    // Log the SMS in the database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabase.from("sms_logs").insert({
      user_id: userId,
      phone_number: phoneNumber,
      message,
      message_type: messageType,
      status: success ? "sent" : "failed",
    }).catch(err => console.error("Failed to log SMS:", err));

    if (!success) {
      return new Response(
        JSON.stringify({ error: "Failed to send SMS", logged: true }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "SMS sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

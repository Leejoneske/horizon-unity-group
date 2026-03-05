import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Parse callback data - could be JSON body or URL query params
    let merchantReference = "";
    let pesapalTransactionId = "";
    let status = "unknown";

    if (req.method === "GET") {
      const url = new URL(req.url);
      merchantReference = url.searchParams.get("OrderMerchantReference") || "";
      pesapalTransactionId = url.searchParams.get("OrderTrackingId") || "";
      status = (url.searchParams.get("OrderNotificationType") || "unknown").toLowerCase();
    } else {
      const body = await req.json();
      merchantReference = body.OrderMerchantReference || "";
      pesapalTransactionId = body.OrderTrackingId || "";
      status = (body.OrderNotificationType || body.OrderStatus || "unknown").toLowerCase();
    }

    console.log("Received Pesapal callback:", { merchantReference, pesapalTransactionId, status });

    if (!merchantReference) {
      throw new Error("Missing merchant reference in callback");
    }

    // Find payment transaction
    const { data: paymentRecord, error: fetchError } = await supabase
      .from("payment_transactions")
      .select("id, user_id, amount, phone_number")
      .eq("merchant_reference", merchantReference)
      .single();

    if (fetchError || !paymentRecord) {
      console.error("Payment record not found:", merchantReference);
      return new Response(JSON.stringify({ error: "Payment record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If we have a tracking ID, check transaction status with PesaPal API
    let paymentStatus = "pending";
    
    if (pesapalTransactionId) {
      const pesapalKey = Deno.env.get("PESAPAL_CONSUMER_KEY");
      const pesapalSecret = Deno.env.get("PESAPAL_CONSUMER_SECRET");

      if (pesapalKey && pesapalSecret) {
        try {
          // Get auth token
          const tokenRes = await fetch("https://pay.pesapal.com/v3/api/Auth/RequestToken", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ consumer_key: pesapalKey, consumer_secret: pesapalSecret }),
          });
          const tokenData = await tokenRes.json();

          if (tokenData.token) {
            // Check transaction status
            const statusRes = await fetch(
              `https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${pesapalTransactionId}`,
              {
                headers: { "Accept": "application/json", "Authorization": `Bearer ${tokenData.token}` },
              }
            );
            const statusData = await statusRes.json();
            console.log("PesaPal status check:", statusData);

            const pesapalStatus = (statusData.payment_status_description || "").toLowerCase();
            if (pesapalStatus === "completed") paymentStatus = "confirmed";
            else if (pesapalStatus === "failed") paymentStatus = "failed";
            else if (pesapalStatus === "cancelled" || pesapalStatus === "reversed") paymentStatus = "cancelled";
          }
        } catch (e) {
          console.error("Error checking PesaPal status:", e);
          // Fall back to callback status
          if (status === "completed" || status === "success") paymentStatus = "confirmed";
          else if (status === "failed" || status === "error") paymentStatus = "failed";
        }
      }
    } else {
      if (status === "completed" || status === "success") paymentStatus = "confirmed";
      else if (status === "failed" || status === "error") paymentStatus = "failed";
      else if (status === "cancelled") paymentStatus = "cancelled";
    }

    // Update payment transaction
    await supabase
      .from("payment_transactions")
      .update({
        status: paymentStatus,
        pesapal_transaction_id: pesapalTransactionId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRecord.id);

    // If payment confirmed, register contribution and send SMS
    if (paymentStatus === "confirmed") {
      const today = new Date().toISOString().split("T")[0];

      const { error: contributionError } = await supabase
        .from("contributions")
        .insert({
          user_id: paymentRecord.user_id,
          amount: paymentRecord.amount,
          contribution_date: today,
          status: "completed",
          notes: `M-Pesa payment via Pesapal - Ref: ${merchantReference}`,
        });

      if (contributionError) {
        console.error("Failed to create contribution:", contributionError);
      } else {
        console.log("Contribution created for user:", paymentRecord.user_id);
      }

      await supabase
        .from("payment_transactions")
        .update({ contribution_date: today })
        .eq("id", paymentRecord.id);

      // Send confirmation SMS
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone_number")
          .eq("user_id", paymentRecord.user_id)
          .single();

        if (profile?.phone_number) {
          const smsMessage = `Great job ${profile.full_name}! Your KES ${paymentRecord.amount.toLocaleString()} contribution has been recorded. Keep saving with Horizon Unit! 🎉`;
          
          await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: profile.phone_number, message: smsMessage }),
          });
          console.log("Confirmation SMS sent to:", profile.phone_number);
        }
      } catch (smsErr) {
        console.error("Confirmation SMS failed:", smsErr);
      }
    }

    console.log(`Payment ${merchantReference} status updated to: ${paymentStatus}`);

    return new Response(
      JSON.stringify({ success: true, message: "Callback processed", reference: merchantReference, status: paymentStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing Pesapal callback:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

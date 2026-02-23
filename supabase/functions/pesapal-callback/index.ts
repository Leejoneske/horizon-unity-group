import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PesapalCallback {
  OrderMerchantReference: string;
  OrderTrackingId: string;
  OrderNotificationType: string;
  OrderStatus: string;
  OrderAmount: string;
  [key: string]: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase configuration missing");
    }

    // Initialize Supabase with service role (admin privileges)
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Parse callback data
    const callbackData = (await req.json()) as PesapalCallback;

    console.log("Received Pesapal callback:", callbackData);

    const merchantReference = callbackData.OrderMerchantReference;
    const pesapalTransactionId = callbackData.OrderTrackingId;
    const status = callbackData.OrderStatus?.toLowerCase() || "unknown";

    if (!merchantReference) {
      throw new Error("Missing merchant reference in callback");
    }

    // Find payment transaction by merchant reference
    const { data: paymentRecord, error: fetchError } = await supabase
      .from("payment_transactions")
      .select("id, user_id, amount, phone_number")
      .eq("merchant_reference", merchantReference)
      .single();

    if (fetchError || !paymentRecord) {
      console.error("Payment record not found:", merchantReference);
      return new Response(JSON.stringify({ error: "Payment record not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Map Pesapal status to our status
    let paymentStatus = "pending";
    if (status === "completed" || status === "success") {
      paymentStatus = "confirmed";
    } else if (status === "failed" || status === "error") {
      paymentStatus = "failed";
    } else if (status === "cancelled") {
      paymentStatus = "cancelled";
    }

    // Update payment transaction
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: paymentStatus,
        pesapal_transaction_id: pesapalTransactionId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRecord.id);

    if (updateError) {
      console.error("Failed to update payment:", updateError);
      throw updateError;
    }

    // If payment confirmed, register contribution
    if (paymentStatus === "confirmed") {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

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
        // Don't throw - payment was confirmed, contribution record failed but payment is valid
      } else {
        console.log("Contribution created for user:", paymentRecord.user_id);
      }

      // Update payment record with contribution date
      await supabase
        .from("payment_transactions")
        .update({
          contribution_date: today,
        })
        .eq("id", paymentRecord.id);
    }

    console.log(`Payment ${merchantReference} status updated to: ${paymentStatus}`);

    // Return success response to Pesapal
    return new Response(
      JSON.stringify({
        success: true,
        message: "Callback processed successfully",
        reference: merchantReference,
        status: paymentStatus,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing Pesapal callback:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

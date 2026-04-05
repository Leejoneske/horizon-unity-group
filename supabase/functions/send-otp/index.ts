import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanPhone = phone.replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      formattedPhone = '254' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 9) {
      formattedPhone = '254' + cleanPhone;
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Store OTP (upsert by phone)
    const { error: upsertError } = await supabase
      .from('phone_verifications')
      .upsert(
        { phone_number: formattedPhone, otp_code: otp, expires_at: expiresAt, verified: false },
        { onConflict: 'phone_number' }
      );

    if (upsertError) {
      console.error('Failed to store OTP:', upsertError);
      throw new Error('Failed to generate verification code');
    }

    // Send OTP via SMS
    const TEXTSMS_API_KEY = Deno.env.get('TEXTSMS_API_KEY');
    const TEXTSMS_PARTNER_ID = Deno.env.get('TEXTSMS_PARTNER_ID');
    const TEXTSMS_SENDER_ID = Deno.env.get('TEXTSMS_SENDER_ID') || 'TextSMS';

    if (!TEXTSMS_API_KEY || !TEXTSMS_PARTNER_ID) {
      throw new Error('SMS credentials not configured');
    }

    const message = `Your Horizon Unit verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;

    const smsResponse = await fetch('https://sms.textsms.co.ke/api/services/sendsms/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: TEXTSMS_API_KEY,
        partnerID: TEXTSMS_PARTNER_ID,
        message,
        shortcode: TEXTSMS_SENDER_ID,
        mobile: formattedPhone,
      }),
    });

    const smsResult = await smsResponse.text();
    console.log('OTP SMS response:', smsResult);

    return new Response(
      JSON.stringify({ success: true, message: 'Verification code sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('OTP error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

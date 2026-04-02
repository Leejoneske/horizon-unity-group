import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SMSRequest {
  to: string;
  message: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TEXTSMS_API_KEY = Deno.env.get('TEXTSMS_API_KEY');
    const TEXTSMS_PARTNER_ID = Deno.env.get('TEXTSMS_PARTNER_ID');
    const TEXTSMS_SENDER_ID = Deno.env.get('TEXTSMS_SENDER_ID') || 'TextSMS';

    if (!TEXTSMS_API_KEY || !TEXTSMS_PARTNER_ID) {
      throw new Error('TextSMS credentials not configured');
    }

    const { to, message }: SMSRequest = await req.json();

    if (!to || !message) {
      throw new Error('Missing required fields: to and message');
    }

    const formattedPhone = formatPhoneNumber(to);

    console.log('Sending SMS via TextSMS to:', formattedPhone);

    // TextSMS API endpoint
    const response = await fetch('https://sms.textsms.co.ke/api/services/sendsms/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: TEXTSMS_API_KEY,
        partnerID: TEXTSMS_PARTNER_ID,
        message: message,
        shortcode: TEXTSMS_SENDER_ID,
        mobile: formattedPhone,
      }),
    });

    const responseText = await response.text();
    console.log('TextSMS raw response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('Non-JSON response from TextSMS:', responseText);
      throw new Error(`TextSMS API error: ${responseText}`);
    }

    // TextSMS returns response with "responses" array
    const success = result?.responses?.[0]?.['response-code'] === 200 || 
                    result?.['response-code'] === 200 ||
                    response.ok;

    const messageId = result?.responses?.[0]?.['messageid'] || 
                      result?.['messageid'] || 'unknown';

    console.log('SMS result:', JSON.stringify(result), 'Success:', success);

    return new Response(
      JSON.stringify({ 
        success,
        message_sid: messageId,
        status: success ? 'Success' : 'Failed',
        raw: result,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error sending SMS:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.startsWith('254')) {
    return cleaned;
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '254' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    return '254' + cleaned;
  }
  
  return cleaned.startsWith('+') ? cleaned.replace('+', '') : cleaned;
}

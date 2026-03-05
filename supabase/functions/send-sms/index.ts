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
    const AT_API_KEY = Deno.env.get('AT_API_KEY');
    const AT_USERNAME = Deno.env.get('AT_USERNAME');
    const AT_SENDER_ID = Deno.env.get('AT_SENDER_ID') || '';

    if (!AT_API_KEY || !AT_USERNAME) {
      throw new Error('Africa\'s Talking credentials not configured');
    }

    const { to, message }: SMSRequest = await req.json();

    if (!to || !message) {
      throw new Error('Missing required fields: to and message');
    }

    const formattedPhone = formatPhoneNumber(to);

    // Africa's Talking SMS API
    const atUrl = 'https://api.africastalking.com/version1/messaging';
    
    const body = new URLSearchParams({
      username: AT_USERNAME,
      to: formattedPhone,
      message: message,
    });

    if (AT_SENDER_ID) {
      body.append('from', AT_SENDER_ID);
    }

    const response = await fetch(atUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': AT_API_KEY,
        'Accept': 'application/json',
      },
      body: body.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Africa\'s Talking API error:', result);
      throw new Error(result.SMSMessageData?.Message || 'Failed to send SMS');
    }

    const recipients = result.SMSMessageData?.Recipients || [];
    const firstRecipient = recipients[0];
    const messageId = firstRecipient?.messageId || 'unknown';
    const status = firstRecipient?.status || 'Unknown';

    console.log('SMS sent via Africa\'s Talking:', messageId, 'Status:', status);

    return new Response(
      JSON.stringify({ 
        success: status === 'Success',
        message_sid: messageId,
        status: status,
        cost: firstRecipient?.cost || '0',
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
    return '+' + cleaned;
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '+254' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    return '+254' + cleaned;
  }
  
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
}

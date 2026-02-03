import { supabase } from '@/integrations/supabase/client';

export interface SMSPayload {
  phoneNumber: string;
  message: string;
  userId: string;
  messageType: 'missed_contribution' | 'successful_contribution' | 'admin_notification';
}

// TextLocal API Configuration - should be in environment variables
const TEXTLOCAL_API_KEY = import.meta.env.VITE_TEXTLOCAL_API_KEY || '';
const TEXTLOCAL_API_URL = 'https://api.textlocal.in/send/';

// Format phone number for different countries
const formatPhoneNumber = (phoneNumber: string): string | null => {
  // Remove all non-digits
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  if (!cleanNumber || cleanNumber.length < 9) {
    console.error('Invalid phone number format:', phoneNumber);
    return null;
  }

  // Check if country code already present
  if (cleanNumber.startsWith('254')) {
    // Kenya - valid
    return cleanNumber;
  } else if (cleanNumber.startsWith('91')) {
    // India - valid
    return cleanNumber;
  } else if (cleanNumber.startsWith('1') && cleanNumber.length === 11) {
    // USA/Canada - valid (1 + 10 digits)
    return cleanNumber;
  } else {
    // Default to Kenya (254) if no country code detected
    let formatted = cleanNumber;
    if (formatted.startsWith('0')) {
      formatted = formatted.substring(1);
    }
    
    // Expected lengths for Kenya are 9 or 10 digits (without country code)
    if (formatted.length === 9 || formatted.length === 10) {
      return '254' + formatted;
    }
    
    // If it's 10 digits starting with 7, 1, or 2 (common Kenya prefixes), assume Kenya
    if (formatted.length === 10 && ['7', '1', '2'].includes(formatted.charAt(0))) {
      return '254' + formatted;
    }
    
    console.error('Could not determine country code for:', phoneNumber);
    return null;
  }
};

export const sendSMS = async (payload: SMSPayload): Promise<boolean> => {
  try {
    // Check if SMS is enabled in environment
    if (!TEXTLOCAL_API_KEY) {
      console.warn('SMS service not configured - API key missing');
      return false;
    }

    const formattedNumber = formatPhoneNumber(payload.phoneNumber);
    
    if (!formattedNumber) {
      console.error('Failed to format phone number:', payload.phoneNumber);
      return false;
    }

    // Call TextLocal API to send SMS
    const params = new URLSearchParams();
    params.append('apikey', TEXTLOCAL_API_KEY);
    params.append('numbers', formattedNumber);
    params.append('message', payload.message);
    params.append('sender', 'HORIZON'); // Sender ID

    const response = await fetch(TEXTLOCAL_API_URL, {
      method: 'POST',
      body: params,
      headers: {
        'Accept': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('TextLocal API Error:', data);
      // Log failed SMS attempt
      await supabase
        .from('sms_logs')
        .insert({
          user_id: payload.userId,
          phone_number: payload.phoneNumber,
          message: payload.message,
          message_type: payload.messageType,
          status: 'failed'
        })
        .catch(err => console.error('Failed to log SMS error:', err));
      return false;
    }

    console.log('SMS sent successfully via TextLocal:', data);

    // Log SMS record in database for tracking
    await supabase
      .from('sms_logs')
      .insert({
        user_id: payload.userId,
        phone_number: payload.phoneNumber,
        message: payload.message,
        message_type: payload.messageType,
        status: 'sent'
      })
      .catch(err => console.error('Failed to log SMS:', err));

    return true;
  } catch (error) {
    console.error('Failed to send SMS via TextLocal:', error);
    // Log the error
    await supabase
      .from('sms_logs')
      .insert({
        user_id: payload.userId,
        phone_number: payload.phoneNumber,
        message: payload.message,
        message_type: payload.messageType,
        status: 'failed'
      })
      .catch(err => console.error('Failed to log SMS error:', err));
    return false;
  }
};

export const sendMissedContributionReminder = async (
  userId: string,
  phoneNumber: string,
  missedDays: number,
  requiredAmount: number
) => {
  const message = `Hi! You've missed ${missedDays} day${missedDays > 1 ? 's' : ''} of contributions. Your next contribution should be KES ${requiredAmount.toLocaleString()} to catch up. Please contribute today on the Horizon Unit app.`;
  
  return sendSMS({
    userId,
    phoneNumber,
    message,
    messageType: 'missed_contribution'
  });
};

export const sendSuccessfulContributionSMS = async (
  userId: string,
  phoneNumber: string,
  amount: number,
  newBalance: number
) => {
  const message = `Great! Your contribution of KES ${amount.toLocaleString()} has been recorded. Your new savings balance is KES ${newBalance.toLocaleString()}. Keep saving! - Horizon Unit`;
  
  return sendSMS({
    userId,
    phoneNumber,
    message,
    messageType: 'successful_contribution'
  });
};

export const sendAdminNotificationSMS = async (
  userId: string,
  phoneNumber: string,
  adminMessage: string
) => {
  const message = `Message from Horizon Unit Admin: ${adminMessage}`;
  
  return sendSMS({
    userId,
    phoneNumber,
    message,
    messageType: 'admin_notification'
  });
};

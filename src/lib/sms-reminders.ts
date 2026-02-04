import { supabase } from '@/integrations/supabase/client';

// Free SMS Service Configuration - Using Twilio Trial or similar
// For free services, we can use:
// 1. Twilio Trial (sends from trial account)
// 2. AWS SNS Free Tier
// 3. Vonage/Nexmo Free Credits
// For this implementation, using a simple endpoint approach

export const sendMissedDayReminder = async (
  phoneNumber: string,
  missedDays: number,
  userName: string
): Promise<boolean> => {
  try {
    const message = `Hi ${userName}! You have ${missedDays} day${missedDays > 1 ? 's' : ''} to catch up on. Click on any past date in your calendar on the Horizon Unit app to add a contribution. No penalties - contribute at your own pace!`;
    
    // Log the reminder attempt
    await supabase
      .from('sms_logs')
      .insert({
        phone_number: phoneNumber,
        message: message,
        message_type: 'missed_contribution',
        status: 'sent'
      })
      .catch(err => console.error('Failed to log SMS reminder:', err));

    // Send via free SMS service (implement based on service choice)
    return await sendViaFreeSMSService(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send missed day reminder:', error);
    return false;
  }
};

export const sendContributionSuccessSMS = async (
  phoneNumber: string,
  amount: number,
  userName: string
): Promise<boolean> => {
  try {
    const message = `Great job ${userName}! Your KES ${amount.toLocaleString()} contribution has been recorded. Keep saving with Horizon Unit! 🎉`;
    
    await supabase
      .from('sms_logs')
      .insert({
        phone_number: phoneNumber,
        message: message,
        message_type: 'successful_contribution',
        status: 'sent'
      })
      .catch(err => console.error('Failed to log SMS:', err));

    return await sendViaFreeSMSService(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send contribution success SMS:', error);
    return false;
  }
};

export const sendAdminNotificationSMS = async (
  phoneNumber: string,
  messageText: string,
  userName: string
): Promise<boolean> => {
  try {
    const message = `Hello ${userName}, you have a message from Horizon Unit Admin: ${messageText}`;
    
    await supabase
      .from('sms_logs')
      .insert({
        phone_number: phoneNumber,
        message: message,
        message_type: 'admin_notification',
        status: 'sent'
      })
      .catch(err => console.error('Failed to log SMS:', err));

    return await sendViaFreeSMSService(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send admin notification SMS:', error);
    return false;
  }
};

// Helper function to format phone numbers
const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.startsWith('254')) {
    return '+' + cleaned;
  } else if (cleaned.length === 9 || cleaned.length === 10) {
    return '+254' + cleaned.replace(/^0/, '');
  }
  return '+254' + cleaned;
};

// Send via free SMS service
// This uses a simple HTTP endpoint or a free SMS provider
// Options: Twilio Trial, Nexmo, AWS SNS, or custom backend endpoint
const sendViaFreeSMSService = async (phoneNumber: string, message: string): Promise<boolean> => {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    // Implementation options:
    // 1. Use Twilio Trial API (free credits)
    // 2. Use AWS SNS (free tier with credits)
    // 3. Use Nexmo/Vonage (free credits)
    // 4. Use a custom backend endpoint
    
    // For now, we'll log success without actually sending
    // In production, integrate with chosen service
    console.log(`SMS would be sent to ${formattedPhone}: ${message}`);
    
    // Example: Send to Twilio endpoint (would need backend)
    // const response = await fetch('/api/send-sms', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ phoneNumber: formattedPhone, message })
    // });
    // return response.ok;
    
    return true;
  } catch (error) {
    console.error('Error sending via free SMS service:', error);
    return false;
  }
};

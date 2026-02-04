// SMS Reminders - Twilio Integration via Edge Function
import { supabase } from '@/integrations/supabase/client';

export const sendMissedDayReminder = async (
  phoneNumber: string,
  missedDays: number,
  userName: string
): Promise<boolean> => {
  try {
    const message = `Hi ${userName}! You have ${missedDays} day${missedDays > 1 ? 's' : ''} to catch up on. Click on any past date in your calendar on the Horizon Unit app to add a contribution. No penalties - contribute at your own pace!`;
    
    return await sendSMS(phoneNumber, message);
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
    
    return await sendSMS(phoneNumber, message);
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
    
    return await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send admin notification SMS:', error);
    return false;
  }
};

export const sendBalanceAdjustmentSMS = async (
  phoneNumber: string,
  amount: number,
  adjustmentType: 'add' | 'deduct',
  userName: string
): Promise<boolean> => {
  try {
    const action = adjustmentType === 'add' ? 'added to' : 'deducted from';
    const message = `Hello ${userName}, KES ${Math.abs(amount).toLocaleString()} has been ${action} your Horizon Unit balance. Check your dashboard for details.`;
    
    return await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send balance adjustment SMS:', error);
    return false;
  }
};

// Core SMS sending function via Edge Function
const sendSMS = async (phoneNumber: string, message: string): Promise<boolean> => {
  try {
    if (!phoneNumber) {
      console.log('No phone number provided, skipping SMS');
      return false;
    }

    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: { to: phoneNumber, message }
    });

    if (error) {
      console.error('Edge function error:', error);
      return false;
    }

    if (data?.success) {
      console.log('SMS sent successfully:', data.message_sid);
      return true;
    } else {
      console.error('SMS sending failed:', data?.error);
      return false;
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

// SMS Reminders - TextSMS Integration via Edge Function
import { supabase } from '@/integrations/supabase/client';

// ── Existing SMS Functions ──

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
    const message = `Hi ${userName}, ${messageText}`;
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

// ── New SMS Functions ──

export const sendWelcomeSMS = async (
  phoneNumber: string,
  userName: string
): Promise<boolean> => {
  try {
    const message = `Welcome to Horizon Unit, ${userName}! 🎉 Your account has been created. Log in to start tracking your daily savings. Together we save, together we grow!`;
    return await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send welcome SMS:', error);
    return false;
  }
};

export const sendCycleStartedSMS = async (
  phoneNumber: string,
  userName: string,
  cycleName: string,
  startDate: string,
  endDate: string,
  dailyAmount: number
): Promise<boolean> => {
  try {
    const message = `Hi ${userName}! A new savings cycle "${cycleName}" has started (${startDate} - ${endDate}). Your daily target is KES ${dailyAmount.toLocaleString()}. Let's save together! 💰`;
    return await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send cycle started SMS:', error);
    return false;
  }
};

export const sendCycleEndingSoonSMS = async (
  phoneNumber: string,
  userName: string,
  cycleName: string,
  daysLeft: number
): Promise<boolean> => {
  try {
    const message = `Hi ${userName}! The savings cycle "${cycleName}" ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Make sure to complete any remaining contributions before it closes! ⏰`;
    return await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send cycle ending soon SMS:', error);
    return false;
  }
};

export const sendCycleEndedSMS = async (
  phoneNumber: string,
  userName: string,
  cycleName: string,
  totalSavings: number
): Promise<boolean> => {
  try {
    const message = `Hi ${userName}! The savings cycle "${cycleName}" has ended. Group total: KES ${totalSavings.toLocaleString()}. Your balance is now visible on your dashboard. Well done! 🏆`;
    return await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send cycle ended SMS:', error);
    return false;
  }
};

export const sendAdminContributionSMS = async (
  phoneNumber: string,
  userName: string,
  amount: number,
  date: string
): Promise<boolean> => {
  try {
    const message = `Hi ${userName}! We have recorded a KES ${amount.toLocaleString()} contribution on your behalf for ${date}. Check your dashboard for details. 📋`;
    return await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send admin contribution SMS:', error);
    return false;
  }
};

export const sendDailyContributionReminderSMS = async (
  phoneNumber: string,
  userName: string,
  dailyAmount: number
): Promise<boolean> => {
  try {
    const message = `Hi ${userName}! Just a friendly reminder to make your daily KES ${dailyAmount.toLocaleString()} contribution today. Stay on track with your savings goal! 📊`;
    return await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send daily reminder SMS:', error);
    return false;
  }
};

export const sendMilestoneCongreatsSMS = async (
  phoneNumber: string,
  userName: string,
  milestoneType: string,
  detail: string
): Promise<boolean> => {
  try {
    const message = `Congratulations ${userName}! 🌟 ${milestoneType}: ${detail}. Keep up the amazing savings habit with Horizon Unit!`;
    return await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send milestone SMS:', error);
    return false;
  }
};

export const sendTargetChangeSMS = async (
  phoneNumber: string,
  userName: string,
  newAmount: number
): Promise<boolean> => {
  try {
    const message = `Hi ${userName}, your daily contribution target has been updated to KES ${newAmount.toLocaleString()}. This applies to future contributions. 📝`;
    return await sendSMS(phoneNumber, message);
  } catch (error) {
    console.error('Failed to send target change SMS:', error);
    return false;
  }
};

// ── Bulk SMS Helper ──

export const sendBulkSMS = async (
  recipients: Array<{ phoneNumber: string; userName: string }>,
  messageBuilder: (userName: string) => string
): Promise<{ sent: number; failed: number }> => {
  let sent = 0;
  let failed = 0;

  const promises = recipients
    .filter(r => r.phoneNumber)
    .map(async (r) => {
      const success = await sendSMS(r.phoneNumber, messageBuilder(r.userName));
      if (success) sent++;
      else failed++;
    });

  await Promise.allSettled(promises);
  return { sent, failed };
};

// ── Core SMS sending function via Edge Function ──

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

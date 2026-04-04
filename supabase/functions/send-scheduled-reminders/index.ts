import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TIMEZONE = 'Africa/Nairobi';
const DEFAULT_REMINDER_TIME = '08:00';
const DEFAULT_INTERVAL_DAYS = 3;
const SETTING_KEYS = [
  'pause_notifications',
  'reminder_time',
  'reminder_mode',
  'reminder_interval_days',
  'reminder_weekdays',
  'reminder_last_run_slot',
];

type ReminderMode = 'daily' | 'interval' | 'weekly';

interface AdminSettingRow {
  setting_key: string;
  setting_value: string;
  updated_by: string | null;
}

interface ProfileRow {
  user_id: string;
  full_name: string;
  phone_number: string | null;
  daily_contribution_amount: number;
}

interface ContributionRow {
  user_id: string;
  contribution_date: string;
}

interface CycleRow {
  id: string;
  start_date: string;
  end_date: string;
  cycle_name: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await readBody(req);
    const force = payload.force === true;
    const onlyUserId = typeof payload.only_user_id === 'string' ? payload.only_user_id : null;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Backend credentials not configured for reminders');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const now = new Date();
    const nowParts = getZonedParts(now);

    const [settingsRes, cycleRes, adminRolesRes] = await Promise.all([
      supabase.from('admin_settings').select('setting_key, setting_value, updated_by').in('setting_key', SETTING_KEYS),
      supabase.from('savings_cycles').select('id, start_date, end_date, cycle_name').eq('status', 'active').maybeSingle(),
      supabase.from('user_roles').select('user_id').eq('role', 'admin'),
    ]);

    if (settingsRes.error) throw settingsRes.error;
    if (cycleRes.error) throw cycleRes.error;
    if (adminRolesRes.error) throw adminRolesRes.error;

    const settings = toSettingsMap(settingsRes.data ?? []);
    const reminderTime = settings.reminder_time ?? DEFAULT_REMINDER_TIME;
    const reminderMode = (settings.reminder_mode ?? 'daily') as ReminderMode;
    const intervalDays = Math.max(1, Number(settings.reminder_interval_days ?? DEFAULT_INTERVAL_DAYS));
    const reminderWeekdays = (settings.reminder_weekdays ?? 'monday')
      .split(',')
      .map((day) => day.trim().toLowerCase())
      .filter(Boolean);

    if (settings.pause_notifications === 'true' && !force) {
      return json({ skipped: true, reason: 'Reminder messages are paused.' });
    }

    if (!cycleRes.data) {
      return json({ skipped: true, reason: 'No active savings cycle.' });
    }

    if (!force && !isTimeMatch(reminderTime, nowParts.hour, nowParts.minute)) {
      return json({ skipped: true, reason: 'Current time does not match configured reminder time.' });
    }

    const runSlot = `${nowParts.date}|${reminderTime}|${reminderMode}`;
    if (!force && settings.reminder_last_run_slot === runSlot) {
      return json({ skipped: true, reason: 'Reminder already sent for this slot.' });
    }

    const adminIds = new Set((adminRolesRes.data ?? []).map((row) => row.user_id));
    const fallbackAdminId = (settingsRes.data ?? []).find((row) => row.updated_by)?.updated_by ?? (adminRolesRes.data ?? [])[0]?.user_id;

    if (!fallbackAdminId) {
      return json({ skipped: true, reason: 'No admin account found to attribute reminders.' });
    }

    const today = nowParts.date;
    if (today < cycleRes.data.start_date || today > cycleRes.data.end_date) {
      return json({ skipped: true, reason: 'Outside the active cycle window.' });
    }

    if (!force && reminderMode === 'weekly' && !reminderWeekdays.includes(nowParts.weekday.toLowerCase())) {
      return json({ skipped: true, reason: 'Today is not one of the configured reminder weekdays.' });
    }

    const [profilesRes, contributionsRes] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, phone_number, daily_contribution_amount'),
      supabase
        .from('contributions')
        .select('user_id, contribution_date')
        .gte('contribution_date', cycleRes.data.start_date)
        .lte('contribution_date', today),
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (contributionsRes.error) throw contributionsRes.error;

    const profiles = (profilesRes.data ?? [])
      .filter((profile) => !adminIds.has(profile.user_id))
      .filter((profile) => !onlyUserId || profile.user_id === onlyUserId);
    const contributionsByUser = groupContributionDates(contributionsRes.data ?? []);
    const yesterday = minDate(addDays(today, -1), cycleRes.data.end_date);

    const notifications: Array<{ user_id: string; admin_id: string; message: string; message_type: string }> = [];
    let smsSent = 0;
    let smsFailed = 0;

    for (const profile of profiles) {
      const contributedDates = contributionsByUser.get(profile.user_id) ?? new Set<string>();
      const hasTodayContribution = contributedDates.has(today);
      const missedDays = yesterday >= cycleRes.data.start_date
        ? countMissingDays(cycleRes.data.start_date, yesterday, contributedDates)
        : 0;

      const reminder = buildReminder({
        cycle: cycleRes.data,
        dailyAmount: Number(profile.daily_contribution_amount ?? 0),
        fullName: profile.full_name,
        hasTodayContribution,
        intervalDays,
        missedDays,
        mode: reminderMode,
      });

      if (!reminder) continue;

      notifications.push({
        user_id: profile.user_id,
        admin_id: fallbackAdminId,
        message: reminder.appMessage,
        message_type: 'reminder',
      });

      if (profile.phone_number) {
        const success = await sendSms({
          anonKey,
          message: reminder.smsMessage,
          phoneNumber: profile.phone_number,
          supabaseUrl,
        });

        if (success) smsSent += 1;
        else smsFailed += 1;
      }
    }

    if (notifications.length > 0) {
      const { error: insertError } = await supabase.from('admin_messages').insert(notifications);
      if (insertError) throw insertError;
    }

    if (!force) {
      const { error: slotError } = await supabase.from('admin_settings').upsert(
        {
          setting_key: 'reminder_last_run_slot',
          setting_value: runSlot,
          updated_by: fallbackAdminId,
        },
        { onConflict: 'setting_key' }
      );

      if (slotError) throw slotError;
    }

    return json({
      forced: force,
      mode: reminderMode,
      notifications_created: notifications.length,
      sms_failed: smsFailed,
      sms_sent: smsSent,
      success: true,
    });
  } catch (error) {
    console.error('Scheduled reminder error:', error);
    return json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      500,
    );
  }
});

function toSettingsMap(rows: AdminSettingRow[]) {
  return rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.setting_key] = row.setting_value;
    return acc;
  }, {});
}

function groupContributionDates(rows: ContributionRow[]) {
  const map = new Map<string, Set<string>>();

  for (const row of rows) {
    if (!map.has(row.user_id)) {
      map.set(row.user_id, new Set<string>());
    }
    map.get(row.user_id)!.add(row.contribution_date);
  }

  return map;
}

function buildReminder({
  cycle,
  dailyAmount,
  fullName,
  hasTodayContribution,
  intervalDays,
  missedDays,
  mode,
}: {
  cycle: CycleRow;
  dailyAmount: number;
  fullName: string;
  hasTodayContribution: boolean;
  intervalDays: number;
  missedDays: number;
  mode: ReminderMode;
}) {
  if ((mode === 'daily' || mode === 'weekly') && hasTodayContribution) {
    return null;
  }

  if (mode === 'interval') {
    if (missedDays === 0 || missedDays % intervalDays !== 0) {
      return null;
    }

    return {
      appMessage: `Reminder: You have missed ${missedDays} contribution day${missedDays > 1 ? 's' : ''}. Please catch up when you can.`,
      smsMessage: `Hi ${fullName}! You have ${missedDays} day${missedDays > 1 ? 's' : ''} to catch up on. Click on any past date in your calendar on the Horizon Unit app to add a contribution. No penalties - contribute at your own pace!`,
    };
  }

  return {
    appMessage: `Reminder: Please make your daily contribution of KES ${dailyAmount.toLocaleString()} today for ${cycle.cycle_name}.`,
    smsMessage: `Hi ${fullName}! Just a friendly reminder to make your daily KES ${dailyAmount.toLocaleString()} contribution today. Stay on track with your savings goal! 📊`,
  };
}

async function sendSms({
  anonKey,
  message,
  phoneNumber,
  supabaseUrl,
}: {
  anonKey: string | undefined;
  message: string;
  phoneNumber: string;
  supabaseUrl: string;
}) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(anonKey ? { Authorization: `Bearer ${anonKey}` } : {}),
      },
      body: JSON.stringify({ to: phoneNumber, message }),
    });

    const data = await response.json().catch(() => ({}));
    return Boolean(response.ok && data?.success);
  } catch (error) {
    console.error('Failed to send scheduled reminder SMS:', error);
    return false;
  }
}

function isTimeMatch(reminderTime: string, currentHour: string, currentMinute: string) {
  const [hour = '08', minute = '00'] = reminderTime.split(':');
  return hour === currentHour && minute === currentMinute;
}

function getZonedParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

  return {
    date: `${pick('year')}-${pick('month')}-${pick('day')}`,
    hour: pick('hour'),
    minute: pick('minute'),
    weekday: pick('weekday'),
  };
}

function countMissingDays(start: string, end: string, contributedDates: Set<string>) {
  let missing = 0;
  let cursor = start;

  while (cursor <= end) {
    if (!contributedDates.has(cursor)) {
      missing += 1;
    }
    cursor = addDays(cursor, 1);
  }

  return missing;
}

function addDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function minDate(left: string, right: string) {
  return left <= right ? left : right;
}

async function readBody(req: Request) {
  try {
    return await req.json();
  } catch {
    return {} as Record<string, unknown>;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

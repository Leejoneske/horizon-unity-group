import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Save, Bell, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const WEEKDAY_OPTIONS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
type ReminderMode = 'daily' | 'interval' | 'weekly';

interface AdminSettingProps {
  adminId: string;
}

export default function AdminSettings({ adminId }: AdminSettingProps) {
  const [minContribution, setMinContribution] = useState('100');
  const [maxContribution, setMaxContribution] = useState('10000');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [reminderMode, setReminderMode] = useState<ReminderMode>('daily');
  const [reminderIntervalDays, setReminderIntervalDays] = useState('3');
  const [reminderWeekdays, setReminderWeekdays] = useState<string[]>(['monday']);
  const [pauseNotifications, setPauseNotifications] = useState(false);
  const [autoPenalty, setAutoPenalty] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      if (data) {
        data.forEach((setting: { setting_key: string; setting_value: string }) => {
          switch (setting.setting_key) {
            case 'min_contribution':
              setMinContribution(setting.setting_value);
              break;
            case 'max_contribution':
              setMaxContribution(setting.setting_value);
              break;
            case 'reminder_time':
              setReminderTime(setting.setting_value);
              break;
            case 'reminder_mode':
              if (['daily', 'interval', 'weekly'].includes(setting.setting_value)) {
                setReminderMode(setting.setting_value as ReminderMode);
              }
              break;
            case 'reminder_interval_days':
              setReminderIntervalDays(setting.setting_value || '3');
              break;
            case 'reminder_weekdays':
              setReminderWeekdays(
                setting.setting_value
                  ? setting.setting_value.split(',').map((day) => day.trim()).filter(Boolean)
                  : ['monday']
              );
              break;
            case 'pause_notifications':
              setPauseNotifications(setting.setting_value === 'true');
              break;
            case 'auto_penalty_amount':
              setAutoPenalty(setting.setting_value);
              break;
          }
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleWeekday = (day: string) => {
    setReminderWeekdays((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day]
    );
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      if (Number(minContribution) > Number(maxContribution)) {
        throw new Error('Minimum contribution cannot be greater than maximum contribution');
      }

      if (reminderMode === 'interval' && (!reminderIntervalDays || Number(reminderIntervalDays) < 1)) {
        throw new Error('Reminder interval must be at least 1 day');
      }

      if (reminderMode === 'weekly' && reminderWeekdays.length === 0) {
        throw new Error('Choose at least one weekday for weekly reminders');
      }

      const settings = [
        { setting_key: 'min_contribution', setting_value: minContribution, updated_by: adminId },
        { setting_key: 'max_contribution', setting_value: maxContribution, updated_by: adminId },
        { setting_key: 'reminder_time', setting_value: reminderTime, updated_by: adminId },
        { setting_key: 'reminder_mode', setting_value: reminderMode, updated_by: adminId },
        { setting_key: 'reminder_interval_days', setting_value: reminderIntervalDays, updated_by: adminId },
        { setting_key: 'reminder_weekdays', setting_value: reminderWeekdays.join(','), updated_by: adminId },
        { setting_key: 'pause_notifications', setting_value: pauseNotifications.toString(), updated_by: adminId },
        { setting_key: 'auto_penalty_amount', setting_value: autoPenalty, updated_by: adminId }
      ];

      const { error } = await supabase
        .from('admin_settings')
        .upsert(settings, { onConflict: 'setting_key' });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Settings and reminder schedule saved'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 px-4 pb-6">
      <h3 className="text-lg font-bold text-gray-900">Group Settings</h3>

      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold text-gray-900">Contribution Settings</h4>
        </div>

        <div>
          <Label className="text-sm">Minimum Contribution (KES)</Label>
          <Input
            type="number"
            value={minContribution}
            onChange={(e) => setMinContribution(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm">Maximum Contribution (KES)</Label>
          <Input
            type="number"
            value={maxContribution}
            onChange={(e) => setMaxContribution(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm">Auto-Penalty for Missed Day (KES)</Label>
          <Input
            type="number"
            value={autoPenalty}
            onChange={(e) => setAutoPenalty(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Set to 0 to disable</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-gray-900">Notification Settings</h4>
        </div>

        <div>
          <Label className="text-sm">Reminder Time</Label>
          <Input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm">Reminder Schedule</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Daily', value: 'daily' },
              { label: 'Every X Days', value: 'interval' },
              { label: 'Weekly', value: 'weekly' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setReminderMode(option.value as ReminderMode)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  reminderMode === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {reminderMode === 'interval' && (
            <div>
              <Label className="text-sm">Send missed-day reminders every</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={reminderIntervalDays}
                  onChange={(e) => setReminderIntervalDays(e.target.value)}
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">day(s)</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Example: 3 days or 7 days.</p>
            </div>
          )}

          {reminderMode === 'weekly' && (
            <div>
              <Label className="text-sm">Send on these days</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {WEEKDAY_OPTIONS.map((day) => (
                  <label key={day} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm capitalize">
                    <input
                      type="checkbox"
                      checked={reminderWeekdays.includes(day)}
                      onChange={() => toggleWeekday(day)}
                      className="w-4 h-4 rounded"
                    />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500">
            {reminderMode === 'daily' && 'Members who have not contributed today will be reminded every day at the selected time.'}
            {reminderMode === 'interval' && 'Members will get catch-up reminders after the chosen number of missed days.'}
            {reminderMode === 'weekly' && 'Members who have not contributed today will be reminded on the selected weekdays.'}
          </p>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={pauseNotifications}
            onChange={(e) => setPauseNotifications(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-gray-700">Pause all reminder messages</span>
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={isLoading}
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        Save Settings
      </button>
    </div>
  );
}

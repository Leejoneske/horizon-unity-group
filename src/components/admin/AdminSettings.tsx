import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Save, Bell, Lock, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AdminSettingProps {
  adminId: string;
}

export default function AdminSettings({ adminId }: AdminSettingProps) {
  const [minContribution, setMinContribution] = useState('100');
  const [maxContribution, setMaxContribution] = useState('10000');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [pauseNotifications, setPauseNotifications] = useState(false);
  const [autoPenalty, setAutoPenalty] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value');

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

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const settings = [
        { key: 'min_contribution', value: minContribution },
        { key: 'max_contribution', value: maxContribution },
        { key: 'reminder_time', value: reminderTime },
        { key: 'pause_notifications', value: pauseNotifications.toString() },
        { key: 'auto_penalty_amount', value: autoPenalty }
      ];

      for (const setting of settings) {
        await supabase
          .from('admin_settings')
          .upsert({
            admin_id: adminId,
            setting_key: setting.key,
            setting_value: setting.value
          }, { onConflict: 'admin_id,setting_key' });
      }

      toast({
        title: 'Success',
        description: 'Settings saved'
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

      {/* Contribution Settings */}
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

      {/* Notification Settings */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-gray-900">Notification Settings</h4>
        </div>

        <div>
          <Label className="text-sm">Daily Reminder Time</Label>
          <Input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="mt-1"
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={pauseNotifications}
            onChange={(e) => setPauseNotifications(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-gray-700">Pause all notifications</span>
        </label>
      </div>

      {/* Save Button */}
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

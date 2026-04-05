import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logAdminAction } from '@/lib/audit-log';
import { createBulkAdminMessages } from '@/lib/admin-notifications';
import { sendBulkSMS } from '@/lib/sms-reminders';
import { Textarea } from '@/components/ui/textarea';

interface AnnouncementsProps {
  adminId: string;
  onRefresh: () => void;
}

export default function AnnouncementsManager({ adminId, onRefresh }: AnnouncementsProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!content.trim()) {
      toast({ title: 'Error', description: 'Please enter a message', variant: 'destructive' });
      return;
    }

    try {
      setIsLoading(true);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone_number')
        .neq('user_id', adminId);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        toast({ title: 'No members', description: 'No members to send to', variant: 'destructive' });
        return;
      }

      const notificationResult = await createBulkAdminMessages(
        profiles.map((profile) => ({
          userId: profile.user_id,
          adminId,
          message: content,
          messageType: 'announcement',
        }))
      );

      if (!notificationResult.success) throw notificationResult.error;

      const { sent, failed } = await sendBulkSMS(
        profiles
          .filter((profile) => profile.phone_number)
          .map((profile) => ({
            phoneNumber: profile.phone_number!,
            userName: profile.full_name,
          })),
        (userName) => `Hi ${userName}, ${content}`
      );

      await logAdminAction(adminId, 'send_announcement', 'announcement', undefined, `Sent to ${profiles.length} members: "${content.substring(0, 80)}"`);

      toast({
        title: failed === 0 ? 'Success' : 'Sent with issues',
        description: failed === 0
          ? `Announcement sent to ${profiles.length} members.`
          : `Announcement saved for ${profiles.length} members. SMS sent: ${sent}, failed: ${failed}.`,
      });

      setContent('');
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 px-4">Send Announcement</h3>

      <div className="px-4 pb-6 space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <Textarea
            placeholder="Write your announcement..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
            rows={4}
          />

          <button
            onClick={handleSend}
            disabled={isLoading || !content.trim()}
            className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isLoading ? 'Sending...' : 'Send to All Members'}
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-3">Quick Templates</h4>
          <div className="space-y-2">
            {[
              { label: 'Reminder', text: 'Reminder: Today is the day to make your contribution. Keep your streak going!' },
              { label: 'Missed Day', text: 'You missed your contribution. Catch up tomorrow to maintain your streak!' },
              { label: 'Milestone', text: "Congratulations! You've reached a milestone. Keep saving!" }
            ].map((template, i) => (
              <button
                key={i}
                onClick={() => setContent(template.text)}
                className="w-full text-left px-3 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition text-sm"
              >
                <p className="font-medium text-gray-900">{template.label}</p>
                <p className="text-xs text-gray-600 truncate">{template.text}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

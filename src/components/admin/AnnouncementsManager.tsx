import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Send, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AnnouncementsProps {
  adminId: string;
  onRefresh: () => void;
}

export default function AnnouncementsManager({ adminId, onRefresh }: AnnouncementsProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sendToAll, setSendToAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('announcements')
        .insert({
          admin_id: adminId,
          title: title,
          content: content,
          sent_to_all: sendToAll
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Announcement sent'
      });

      setTitle('');
      setContent('');
      setSendToAll(false);
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send';
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
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 px-4">Send Announcement</h3>

      <div className="px-4 pb-6 space-y-4">
        {/* Send Form */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <Input
            placeholder="Announcement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm"
          />

          <textarea
            placeholder="Announcement content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
            rows={4}
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sendToAll}
              onChange={(e) => setSendToAll(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-700">Send to all members</span>
          </label>

          <button
            onClick={handleSend}
            disabled={isLoading || !title.trim() || !content.trim()}
            className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Announcement
          </button>
        </div>

        {/* SMS Template Suggestions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-3">Quick Templates</h4>
          <div className="space-y-2">
            {[
              { title: 'Reminder', content: 'Reminder: Today is the day to make your contribution. Keep your streak going!' },
              { title: 'Missed Day', content: 'You missed your contribution. Catch up tomorrow to maintain your streak!' },
              { title: 'Milestone', content: 'Congratulations! You\'ve reached a milestone. Keep saving!' }
            ].map((template, i) => (
              <button
                key={i}
                onClick={() => {
                  setTitle(template.title);
                  setContent(template.content);
                }}
                className="w-full text-left px-3 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition text-sm"
              >
                <p className="font-medium text-gray-900">{template.title}</p>
                <p className="text-xs text-gray-600 truncate">{template.content}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

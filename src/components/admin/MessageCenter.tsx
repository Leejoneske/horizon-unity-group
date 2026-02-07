import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { sendAdminNotificationSMS } from '@/lib/sms-reminders';
import { Send, Trash2, Edit2, Plus, AlertCircle, Info, Bell, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Message {
  id: string;
  message: string;
  message_type: string;
  user_id: string;
  admin_id: string;
  is_read: boolean;
  created_at: string;
  recipient_name?: string;
}

interface Member {
  user_id: string;
  full_name: string;
}

interface MessageCenterProps {
  adminId: string;
  members: Member[];
}

export default function MessageCenter({ adminId, members }: MessageCenterProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'warning' | 'announcement'>('info');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const messagesWithNames = data?.map(msg => {
        const member = members.find(m => m.user_id === msg.user_id);
        return { ...msg, recipient_name: member?.full_name || 'Unknown' };
      }) || [];

      setMessages(messagesWithNames);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId) return;
    
    setIsSending(true);
    try {
      if (editingMessage) {
        const { error } = await supabase
          .from('admin_messages')
          .update({ message: newMessage, message_type: messageType })
          .eq('id', editingMessage.id);

        if (error) throw error;
        toast({ title: 'Message updated', description: 'Your message has been updated successfully.' });
      } else {
        // First, insert the message to the database
        const { error: insertError } = await supabase
          .from('admin_messages')
          .insert({ message: newMessage, message_type: messageType, user_id: selectedUserId, admin_id: adminId });

        if (insertError) throw insertError;

        // Message saved successfully - now try to send SMS (don't fail if SMS fails)
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('phone_number, full_name')
            .eq('user_id', selectedUserId)
            .maybeSingle();

          if (profileData?.phone_number) {
            await sendAdminNotificationSMS(profileData.phone_number, newMessage, profileData.full_name);
          }
        } catch (smsErr) {
          console.error('SMS notification failed (message was still saved):', smsErr);
        }

        toast({ title: 'Message sent', description: 'Your message has been sent successfully.' });
      }

      setIsDialogOpen(false);
      setNewMessage('');
      setMessageType('info');
      setSelectedUserId('');
      setEditingMessage(null);
      fetchMessages();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase.from('admin_messages').delete().eq('id', messageId);
      if (error) throw error;
      toast({ title: 'Message deleted', description: 'The message has been deleted.' });
      fetchMessages();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete message';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setNewMessage(message.message);
    setMessageType(message.message_type as 'info' | 'warning' | 'announcement');
    setSelectedUserId(message.user_id);
    setIsDialogOpen(true);
  };

  const handleBroadcast = async () => {
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    try {
      const messagesToInsert = members.map(member => ({
        message: newMessage,
        message_type: messageType,
        user_id: member.user_id,
        admin_id: adminId,
      }));

      const { error } = await supabase.from('admin_messages').insert(messagesToInsert);
      if (error) throw error;

      toast({ title: 'Broadcast sent', description: `Message sent to ${members.length} members.` });
      setIsDialogOpen(false);
      setNewMessage('');
      setMessageType('info');
      setSelectedUserId('');
      fetchMessages();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to broadcast message';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertCircle className="w-5 h-5 text-white" />;
      case 'announcement': return <Bell className="w-5 h-5 text-white" />;
      default: return <Info className="w-5 h-5 text-white" />;
    }
  };

  const getMessageGradient = (type: string) => {
    switch (type) {
      case 'warning': return 'from-amber-400 to-orange-500';
      case 'announcement': return 'from-blue-400 to-blue-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-600">Messages</h3>
        <button 
          onClick={() => setIsDialogOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full text-xs font-semibold text-white hover:from-blue-600 hover:to-blue-700 transition active:scale-95 flex items-center gap-1 shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-3 h-3" /> New Message
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-2xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded-full w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded-full w-1/2 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-bold text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
            Send your first message to members. They'll receive notifications in their dashboard.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.slice(0, 10).map((message) => (
            <div key={message.id} className="bg-gray-100 rounded-2xl p-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getMessageGradient(message.message_type)} flex items-center justify-center flex-shrink-0`}>
                  {getMessageIcon(message.message_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{message.recipient_name}</p>
                    {!message.is_read && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">New</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{message.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{format(parseISO(message.created_at), 'MMM d, HH:mm')}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => handleEditMessage(message)}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition active:scale-95"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  <button 
                    onClick={() => handleDeleteMessage(message.id)}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-red-50 transition active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New/Edit Message Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-gray-900">
                {editingMessage ? 'Edit Message' : 'New Message'}
              </h3>
              <button 
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingMessage(null);
                  setNewMessage('');
                  setSelectedUserId('');
                }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="recipient" className="text-sm font-medium text-gray-700">Recipient</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(member => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium text-gray-700">Message Type</Label>
                <Select value={messageType} onValueChange={(v) => setMessageType(v as any)}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Information</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium text-gray-700">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  className="rounded-xl border-gray-200 resize-none"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={handleSendMessage}
                disabled={isSending || !newMessage.trim() || !selectedUserId}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full font-semibold text-white hover:from-blue-600 hover:to-blue-700 transition shadow-lg shadow-blue-500/30 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Sending...' : (editingMessage ? 'Update' : 'Send')}
              </button>
              {!editingMessage && (
                <button 
                  onClick={handleBroadcast}
                  disabled={isSending || !newMessage.trim()}
                  className="w-full py-4 px-6 bg-gray-100 rounded-full font-semibold text-gray-900 hover:bg-gray-200 transition active:scale-95 disabled:opacity-50"
                >
                  Broadcast to All ({members.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

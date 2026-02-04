import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { sendAdminNotificationSMS } from '@/lib/sms-reminders';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Edit2,
  Plus,
  AlertCircle,
  Info,
  Bell
} from 'lucide-react';
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

      // Add recipient names
      const messagesWithNames = data?.map(msg => {
        const member = members.find(m => m.user_id === msg.user_id);
        return {
          ...msg,
          recipient_name: member?.full_name || 'Unknown'
        };
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
        // Update existing message
        const { error } = await supabase
          .from('admin_messages')
          .update({
            message: newMessage,
            message_type: messageType,
          })
          .eq('id', editingMessage.id);

        if (error) throw error;

        toast({
          title: 'Message updated',
          description: 'Your message has been updated successfully.',
        });
      } else {
        // Create new message
        const { error } = await supabase
          .from('admin_messages')
          .insert({
            message: newMessage,
            message_type: messageType,
            user_id: selectedUserId,
            admin_id: adminId,
          });

        if (error) throw error;

        // Fetch user's phone number and SMS preference to send SMS notification
        const { data: profileData } = await supabase
          .from('profiles')
          .select('phone_number, sms_enabled, full_name')
          .eq('user_id', selectedUserId)
          .single();

        if (profileData?.sms_enabled && profileData?.phone_number) {
          await sendAdminNotificationSMS(
            profileData.phone_number,
            newMessage,
            profileData.full_name
          ).catch(err => console.error('SMS notification sending failed:', err));
        }

        toast({
          title: 'Message sent',
          description: 'Your message has been sent successfully.',
        });
      }

      setIsDialogOpen(false);
      setNewMessage('');
      setMessageType('info');
      setSelectedUserId('');
      setEditingMessage(null);
      fetchMessages();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: 'Message deleted',
        description: 'The message has been deleted.',
      });
      fetchMessages();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete message';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
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

      const { error } = await supabase
        .from('admin_messages')
        .insert(messagesToInsert);

      if (error) throw error;

      toast({
        title: 'Broadcast sent',
        description: `Message sent to ${members.length} members.`,
      });

      setIsDialogOpen(false);
      setNewMessage('');
      setMessageType('info');
      setSelectedUserId('');
      fetchMessages();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to broadcast message';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'announcement':
        return <Bell className="w-4 h-4 text-primary" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="finance-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Message Center
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingMessage(null);
            setNewMessage('');
            setSelectedUserId('');
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingMessage ? 'Edit Message' : 'Send Message'}</DialogTitle>
              <DialogDescription>
                {editingMessage ? 'Update your message' : 'Send a message to a member or broadcast to all'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
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
                <Label htmlFor="type">Message Type</Label>
                <Select value={messageType} onValueChange={(v) => setMessageType(v as any)}>
                  <SelectTrigger>
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
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isSending || !newMessage.trim() || !selectedUserId} 
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSending ? 'Sending...' : (editingMessage ? 'Update' : 'Send')}
                </Button>
                {!editingMessage && (
                  <Button 
                    variant="outline"
                    onClick={handleBroadcast} 
                    disabled={isSending || !newMessage.trim()} 
                  >
                    Broadcast All
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading messages...</p>
      ) : messages.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No messages yet.</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {messages.slice(0, 10).map((message) => (
            <div 
              key={message.id} 
              className={`flex items-start justify-between p-3 rounded-lg border ${
                message.is_read ? 'border-border bg-muted/30' : 'border-primary/20 bg-primary/5'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  {getMessageIcon(message.message_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{message.recipient_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(message.created_at), 'MMM d, HH:mm')}
                    </span>
                    {!message.is_read && (
                      <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                        Unread
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground break-words">{message.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditMessage(message)}
                  className="h-8 w-8"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteMessage(message.id)}
                  className="h-8 w-8 text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

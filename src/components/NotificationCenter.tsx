import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bell, X, MessageSquare, AlertCircle, Info, Check } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  message: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  userId: string;
  onUnreadCountChange?: (count: number) => void;
}

export default function NotificationCenter({ userId, onUnreadCountChange }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('admin_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setNotifications(data);
        onUnreadCountChange?.(data.filter(n => !n.is_read).length);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_messages',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          onUnreadCountChange?.((prev => prev.filter(n => !n.is_read).length + 1)(notifications));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      await supabase.from('admin_messages').update({ is_read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      onUnreadCountChange?.(notifications.filter(n => !n.is_read && n.id !== id).length);
    } catch (e) {
      console.error('Failed to mark as read:', e);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    try {
      for (const id of unreadIds) {
        await supabase.from('admin_messages').update({ is_read: true }).eq('id', id);
      }
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      onUnreadCountChange?.(0);
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type: string) => {
    if (type === 'warning') return <AlertCircle className="w-5 h-5 text-amber-500" />;
    if (type === 'announcement') return <MessageSquare className="w-5 h-5 text-blue-500" />;
    return <Info className="w-5 h-5 text-gray-500" />;
  };

  const getIconBg = (type: string) => {
    if (type === 'warning') return 'bg-amber-100';
    if (type === 'announcement') return 'bg-blue-100';
    return 'bg-gray-100';
  };

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={() => { setIsOpen(true); fetchNotifications(); }}
        className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition relative"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />
          
          {/* Panel - slides from right */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-500">{unreadCount} unread</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-400 animate-pulse">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No notifications yet</p>
                  <p className="text-gray-400 text-sm mt-1">Messages from admin will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map(notification => (
                    <button
                      key={notification.id}
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                      className={`w-full text-left px-5 py-4 flex items-start gap-3 transition hover:bg-gray-50 ${
                        !notification.is_read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${getIconBg(notification.message_type)}`}>
                        {getIcon(notification.message_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0 mt-2" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { supabase } from '@/integrations/supabase/client';

interface AdminMessageInput {
  adminId: string;
  message: string;
  messageType?: string;
  userId: string;
}

export async function createAdminMessage({
  adminId,
  message,
  messageType = 'info',
  userId,
}: AdminMessageInput) {
  const { error } = await supabase.from('admin_messages').insert({
    user_id: userId,
    admin_id: adminId,
    message,
    message_type: messageType,
  });

  if (error) {
    console.error('Failed to create admin message:', error);
    return { success: false as const, error };
  }

  return { success: true as const };
}

export async function createBulkAdminMessages(messages: AdminMessageInput[]) {
  if (messages.length === 0) {
    return { success: true as const };
  }

  const { error } = await supabase.from('admin_messages').insert(
    messages.map(({ adminId, message, messageType = 'info', userId }) => ({
      user_id: userId,
      admin_id: adminId,
      message,
      message_type: messageType,
    }))
  );

  if (error) {
    console.error('Failed to create bulk admin messages:', error);
    return { success: false as const, error };
  }

  return { success: true as const };
}

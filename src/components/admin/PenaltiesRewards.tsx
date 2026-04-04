import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingDown, TrendingUp, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createAdminMessage } from '@/lib/admin-notifications';
import { sendBalanceAdjustmentSMS } from '@/lib/sms-reminders';
import { Input } from '@/components/ui/input';

interface PenaltiesRewardsProps {
  member: { user_id: string; full_name: string; balance_adjustment: number; phone_number: string | null };
  adminId: string;
  onRefresh: () => void;
}

export default function PenaltiesRewards({ member, adminId, onRefresh }: PenaltiesRewardsProps) {
  const [type, setType] = useState<'penalty' | 'reward'>('penalty');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleApply = async () => {
    if (!amount || !reason.trim()) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    try {
      setIsLoading(true);
      const parsedAmount = parseFloat(amount);

      const { error: adjustError } = await supabase
        .from('balance_adjustments')
        .insert({
          user_id: member.user_id,
          admin_id: adminId,
          amount: type === 'penalty' ? -parsedAmount : parsedAmount,
          adjustment_type: type,
          reason,
        });

      if (adjustError) throw adjustError;

      const newAdjustment = (member.balance_adjustment || 0) + (type === 'penalty' ? -parsedAmount : parsedAmount);
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ balance_adjustment: newAdjustment })
        .eq('user_id', member.user_id);

      if (profileError) throw profileError;

      const action = type === 'penalty' ? 'deducted from' : 'added to';
      const notificationResult = await createAdminMessage({
        userId: member.user_id,
        adminId,
        message: `KES ${parsedAmount.toLocaleString()} has been ${action} your balance as a ${type}. Reason: ${reason}`,
        messageType: type === 'penalty' ? 'warning' : 'info',
      });

      const smsSent = member.phone_number
        ? await sendBalanceAdjustmentSMS(
            member.phone_number,
            parsedAmount,
            type === 'penalty' ? 'deduct' : 'add',
            member.full_name
          )
        : false;

      toast({
        title: notificationResult.success && (!member.phone_number || smsSent) ? 'Success' : 'Applied with issues',
        description: notificationResult.success && (!member.phone_number || smsSent)
          ? `${type === 'penalty' ? 'Penalty' : 'Reward'} applied and member notified.`
          : `${type === 'penalty' ? 'Penalty' : 'Reward'} applied, but ${!notificationResult.success ? 'in-app notification' : 'SMS'} needs attention.`,
      });

      setAmount('');
      setReason('');
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">Penalties & Rewards</h4>

      <div className="space-y-3 bg-gray-50 rounded-lg p-3">
        <div className="flex gap-2">
          <button
            onClick={() => setType('penalty')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1 ${
              type === 'penalty' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            Penalty
          </button>
          <button
            onClick={() => setType('reward')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1 ${
              type === 'reward' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Reward
          </button>
        </div>

        <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-sm" />
        <Input placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} className="text-sm" />

        <button
          onClick={handleApply}
          disabled={isLoading || !amount || !reason.trim()}
          className={`w-full py-2 px-3 rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 text-white ${
            type === 'penalty' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          <Plus className="w-4 h-4" />
          Apply {type === 'penalty' ? 'Penalty' : 'Reward'}
        </button>
      </div>
    </div>
  );
}

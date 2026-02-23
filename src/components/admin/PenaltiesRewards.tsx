import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingDown, TrendingUp, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PenaltyReward {
  id: string;
  amount: number;
  reason: string;
  type: 'penalty' | 'reward';
  applied_date: string;
}

interface PenaltiesRewardsProps {
  member: any;
  adminId: string;
  onRefresh: () => void;
}

export default function PenaltiesRewards({ member, adminId, onRefresh }: PenaltiesRewardsProps) {
  const [type, setType] = useState<'penalty' | 'reward'>('penalty');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<PenaltyReward[]>([]);
  const { toast } = useToast();

  const handleApply = async () => {
    if (!amount || !reason.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      const table = type === 'penalty' ? 'member_penalties' : 'member_rewards';
      
      const { error } = await supabase
        .from(table)
        .insert({
          user_id: member.user_id,
          admin_id: adminId,
          amount: parseFloat(amount),
          reason: reason
        });

      if (error) throw error;

      // Update profile
      const fieldName = type === 'penalty' ? 'penalty_amount' : 'reward_amount';
      const currentValue = type === 'penalty' ? member.penalty_amount || 0 : member.reward_amount || 0;
      const newValue = currentValue + parseFloat(amount);

      await supabase
        .from('profiles')
        .update({ [fieldName]: newValue })
        .eq('user_id', member.user_id);

      toast({
        title: 'Success',
        description: `${type === 'penalty' ? 'Penalty' : 'Reward'} applied`
      });

      setAmount('');
      setReason('');
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply';
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
      <h4 className="font-semibold text-gray-900">Penalties & Rewards</h4>

      {/* Current Status */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-xs text-red-600 mb-1">Total Penalties</p>
          <p className="font-bold text-red-700">KES {(member.penalty_amount || 0).toLocaleString()}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
          <p className="text-xs text-green-600 mb-1">Total Rewards</p>
          <p className="font-bold text-green-700">KES {(member.reward_amount || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Apply Form */}
      <div className="space-y-3 bg-gray-50 rounded-lg p-3">
        <div className="flex gap-2">
          <button
            onClick={() => setType('penalty')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1 ${
              type === 'penalty'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            Penalty
          </button>
          <button
            onClick={() => setType('reward')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1 ${
              type === 'reward'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Reward
          </button>
        </div>

        <Input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-sm"
        />

        <Input
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="text-sm"
        />

        <button
          onClick={handleApply}
          disabled={isLoading || !amount || !reason.trim()}
          className={`w-full py-2 px-3 rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 text-white ${
            type === 'penalty'
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          <Plus className="w-4 h-4" />
          Apply {type === 'penalty' ? 'Penalty' : 'Reward'}
        </button>
      </div>
    </div>
  );
}

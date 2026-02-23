import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Plus, Minus, Settings, X, Info } from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string | null;
  total_contributions: number;
  contribution_count: number;
  balance_visible: boolean;
  daily_contribution_amount: number;
  balance_adjustment: number;
  missed_contributions: number;
  last_login?: string;
  is_online?: boolean;
}

interface MemberManagementProps {
  members: Member[];
  onRefresh: () => void;
  adminId: string;
}

export default function MemberManagement({ members, onRefresh, adminId }: MemberManagementProps) {
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [newDailyAmount, setNewDailyAmount] = useState('');
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isContribDialogOpen, setIsContribDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleToggleVisibility = async (member: Member) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance_visible: !member.balance_visible })
        .eq('user_id', member.user_id);

      if (error) throw error;

      toast({
        title: 'Visibility updated',
        description: `Balance is now ${!member.balance_visible ? 'visible' : 'hidden'} for ${member.full_name}`,
      });
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update visibility';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleToggleAllVisibility = async (visible: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance_visible: visible })
        .neq('user_id', adminId);

      if (error) throw error;

      toast({
        title: 'All balances updated',
        description: `All member balances are now ${visible ? 'visible' : 'hidden'}`,
      });
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update visibility';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleBalanceAdjustment = async () => {
    if (!selectedMember || !adjustmentAmount) return;
    
    setIsLoading(true);
    try {
      const amount = parseFloat(adjustmentAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const { error: adjustError } = await supabase
        .from('balance_adjustments')
        .insert({
          user_id: selectedMember.user_id,
          admin_id: adminId,
          amount: adjustmentType === 'add' ? amount : -amount,
          adjustment_type: adjustmentType,
          reason: adjustmentReason || null,
        });

      if (adjustError) throw adjustError;

      const currentAdjustment = selectedMember.balance_adjustment || 0;
      const newAdjustment = adjustmentType === 'add' 
        ? currentAdjustment + amount 
        : currentAdjustment - amount;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ balance_adjustment: newAdjustment })
        .eq('user_id', selectedMember.user_id);

      if (profileError) throw profileError;

      toast({
        title: 'Balance adjusted',
        description: `${adjustmentType === 'add' ? 'Added' : 'Deducted'} KES ${amount.toLocaleString()} ${adjustmentType === 'add' ? 'to' : 'from'} ${selectedMember.full_name}'s balance`,
      });
      
      setIsAdjustDialogOpen(false);
      setAdjustmentAmount('');
      setAdjustmentReason('');
      setSelectedMember(null);
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to adjust balance';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContributionAmountChange = async () => {
    if (!selectedMember || !newDailyAmount) return;
    
    setIsLoading(true);
    try {
      const amount = parseFloat(newDailyAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ daily_contribution_amount: amount })
        .eq('user_id', selectedMember.user_id);

      if (error) throw error;

      toast({
        title: 'Contribution amount updated',
        description: `${selectedMember.full_name}'s daily contribution is now KES ${amount.toLocaleString()}`,
      });
      
      setIsContribDialogOpen(false);
      setNewDailyAmount('');
      setSelectedMember(null);
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update contribution amount';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const openAdjustDialog = (member: Member, type: 'add' | 'deduct') => {
    setSelectedMember(member);
    setAdjustmentType(type);
    setIsAdjustDialogOpen(true);
  };

  const openContribDialog = (member: Member) => {
    setSelectedMember(member);
    setNewDailyAmount(member.daily_contribution_amount.toString());
    setIsContribDialogOpen(true);
  };

  const openUserDetailDialog = (member: Member) => {
    navigate(`/admin/member/${member.user_id}`);
  };

  // Check if all members have balance visible
  const allVisible = members.length > 0 && members.every(m => m.balance_visible);

  return (
    <>
      {/* Header with visibility toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-600">All Members</h3>
        <button 
          onClick={() => handleToggleAllVisibility(!allVisible)} 
          className={`px-4 py-2 rounded-full text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 ${
            allVisible 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          {allVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {allVisible ? 'Balances Visible' : 'Balances Hidden'}
        </button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-bold text-gray-900 mb-2">No members yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
            When members join, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const effectiveBalance = member.total_contributions + (member.balance_adjustment || 0);
            return (
              <div key={member.id} className="bg-gray-100 rounded-2xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white font-bold relative">
                    {member.full_name.substring(0, 2).toUpperCase()}
                    {member.is_online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{member.full_name}</p>
                      <button 
                        onClick={() => handleToggleVisibility(member)} 
                        className="p-1 rounded-full hover:bg-gray-200 transition"
                      >
                        {member.balance_visible 
                          ? <Eye className="w-3.5 h-3.5 text-green-600" /> 
                          : <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                        }
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">{member.phone_number || 'No phone'}</p>
                    <p className="text-sm font-bold text-green-600 mt-1">KES {effectiveBalance.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openUserDetailDialog(member)}
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-blue-50 transition active:scale-95"
                      title="View user details"
                    >
                      <Info className="w-4 h-4 text-blue-600" />
                    </button>
                    <button 
                      onClick={() => openAdjustDialog(member, 'add')}
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-green-50 transition active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-green-600" />
                    </button>
                    <button 
                      onClick={() => openAdjustDialog(member, 'deduct')}
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-red-50 transition active:scale-95"
                    >
                      <Minus className="w-4 h-4 text-red-600" />
                    </button>
                    <button 
                      onClick={() => openContribDialog(member)}
                      className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition active:scale-95"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Balance Adjustment Modal */}
      {isAdjustDialogOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-gray-900">
                {adjustmentType === 'add' ? 'Add to Balance' : 'Deduct from Balance'}
              </h3>
              <button 
                onClick={() => setIsAdjustDialogOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              {adjustmentType === 'add' ? 'Add funds to' : 'Deduct funds from'} {selectedMember?.full_name}'s account
            </p>
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="adjustAmount" className="text-sm font-medium text-gray-700">Amount (KES)</Label>
                <Input
                  id="adjustAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustReason" className="text-sm font-medium text-gray-700">Reason (optional)</Label>
                <Input
                  id="adjustReason"
                  placeholder="Enter reason for adjustment"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setIsAdjustDialogOpen(false)} 
                className="py-4 px-6 bg-gray-100 rounded-full font-semibold text-gray-900 hover:bg-gray-200 transition active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={handleBalanceAdjustment}
                disabled={isLoading || !adjustmentAmount}
                className={`py-4 px-6 rounded-full font-semibold text-white transition shadow-lg active:scale-95 ${
                  adjustmentType === 'add' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/30 hover:from-green-600 hover:to-green-700' 
                    : 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/30 hover:from-red-600 hover:to-red-700'
                } disabled:opacity-50`}
              >
                {isLoading ? 'Processing...' : adjustmentType === 'add' ? 'Add' : 'Deduct'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contribution Amount Modal */}
      {isContribDialogOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl text-gray-900">Daily Contribution</h3>
              <button 
                onClick={() => setIsContribDialogOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Set the daily contribution target for {selectedMember?.full_name}
            </p>
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="dailyAmount" className="text-sm font-medium text-gray-700">Daily Amount (KES)</Label>
                <Input
                  id="dailyAmount"
                  type="number"
                  placeholder="Enter daily amount"
                  value={newDailyAmount}
                  onChange={(e) => setNewDailyAmount(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setIsContribDialogOpen(false)} 
                className="py-4 px-6 bg-gray-100 rounded-full font-semibold text-gray-900 hover:bg-gray-200 transition active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={handleContributionAmountChange}
                disabled={isLoading || !newDailyAmount}
                className="py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full font-semibold text-white hover:from-blue-600 hover:to-blue-700 transition shadow-lg shadow-blue-500/30 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
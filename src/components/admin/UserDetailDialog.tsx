import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, Calendar, Clock, Key, Plus, Minus, Settings, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isSameDay } from 'date-fns';

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

interface Contribution {
  id: string;
  user_id: string;
  amount: number;
  contribution_date: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface UserDetailDialogProps {
  member: Member;
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
  onRefresh: () => void;
}

export default function UserDetailDialog({ member, isOpen, onClose, adminId, onRefresh }: UserDetailDialogProps) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [contributionAmount, setContributionAmount] = useState(member?.daily_contribution_amount?.toString() || '100');
  const [isAddingContrib, setIsAddingContrib] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && member) {
      fetchContributions();
    }
  }, [isOpen, member]);

  const fetchContributions = async () => {
    try {
      setIsLoading(true);
      const { data: contribData } = await supabase
        .from('contributions')
        .select('*')
        .eq('user_id', member.user_id)
        .order('contribution_date', { ascending: false });

      if (contribData) {
        setContributions(contribData);
      }
    } catch (error) {
      console.error('Error fetching contributions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch contributions',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContributionForDate = async () => {
    if (!selectedDate) {
      toast({
        title: 'Error',
        description: 'Please select a date',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsAddingContrib(true);
      const existingContrib = contributions.find(c => c.contribution_date === selectedDate);

      if (existingContrib) {
        toast({
          title: 'Error',
          description: 'Contribution already exists for this date',
          variant: 'destructive'
        });
        return;
      }

      const amount = parseFloat(contributionAmount) || member.daily_contribution_amount;
      
      const { error } = await supabase
        .from('contributions')
        .insert({
          user_id: member.user_id,
          amount: amount,
          contribution_date: selectedDate,
          status: 'completed',
          notes: 'Admin added'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Contribution of KES ${amount.toLocaleString()} added for ${format(new Date(selectedDate), 'MMM d, yyyy')}`
      });

      setSelectedDate('');
      fetchContributions();
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add contribution';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsAddingContrib(false);
    }
  };

  const handleRemoveContribution = async (contributionId: string) => {
    if (!confirm('Are you sure you want to remove this contribution?')) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('contributions')
        .delete()
        .eq('id', contributionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Contribution removed'
      });

      fetchContributions();
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove contribution';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsResettingPassword(true);
      // Since we can't directly reset via user ID from admin, we'll send a password reset email
      const { error } = await supabase.auth.admin.updateUserById(member.user_id, {
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Password reset for ${member.full_name}`
      });

      setNewPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (!isOpen || !member) return null;

  const effectiveBalance = member.total_contributions + (member.balance_adjustment || 0);
  const lastLoginDate = member.last_login ? new Date(member.last_login) : null;
  const lastLoginText = lastLoginDate ? format(lastLoginDate, 'MMM d, yyyy HH:mm') : 'Never';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-6 flex items-center justify-between border-b border-gray-200">
          <div>
            <h3 className="font-bold text-2xl text-gray-900">{member.full_name}</h3>
            <p className="text-sm text-gray-500 mt-1">{member.phone_number || 'No phone on file'}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition shadow-sm"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Status Section */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-600 mb-4">Status & Activity</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-gray-600">Online Status</p>
                </div>
                <p className="font-semibold text-gray-900">
                  {member.is_online ? (
                    <span className="text-green-600">🟢 Online</span>
                  ) : (
                    <span className="text-gray-500">⚪ Offline</span>
                  )}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <p className="text-xs text-gray-600">Last Login</p>
                </div>
                <p className="font-semibold text-gray-900 text-sm">{lastLoginText}</p>
              </div>
            </div>
          </div>

          {/* Financials Section */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-600 mb-4">Financial Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-xs text-green-600 mb-1">Total Balance</p>
                <p className="text-2xl font-bold text-green-700">KES {effectiveBalance.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs text-blue-600 mb-1">Contributions</p>
                <p className="text-2xl font-bold text-blue-700">{member.contribution_count}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <p className="text-xs text-purple-600 mb-1">Daily Amount</p>
                <p className="text-2xl font-bold text-purple-700">KES {member.daily_contribution_amount.toLocaleString()}</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <p className="text-xs text-orange-600 mb-1">Missed Days</p>
                <p className="text-2xl font-bold text-orange-700">{member.missed_contributions}</p>
              </div>
            </div>
          </div>

          {/* Contribution Management Section */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-600 mb-4">Add Contribution</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contrib-date" className="text-sm font-medium text-gray-700">Date</Label>
                <Input
                  id="contrib-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contrib-amount" className="text-sm font-medium text-gray-700">Amount (KES)</Label>
                <Input
                  id="contrib-amount"
                  type="number"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <button
                onClick={handleAddContributionForDate}
                disabled={isAddingContrib || !selectedDate}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl font-semibold text-white hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {isAddingContrib ? 'Adding...' : 'Add Contribution'}
              </button>
            </div>
          </div>

          {/* Recent Contributions */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-600 mb-4">Recent Contributions</h4>
            {isLoading ? (
              <div className="text-center py-4 text-gray-400">Loading...</div>
            ) : contributions.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm">No contributions yet</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {contributions.slice(0, 10).map((contrib) => (
                  <div key={contrib.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition">
                    <div className="flex items-center gap-3 flex-1">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{format(parseISO(contrib.contribution_date), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-gray-500">KES {contrib.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveContribution(contrib.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 transition"
                      title="Remove contribution"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Password Reset Section */}
          <div className="px-6 py-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-4">Security</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">Reset Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password (min. 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <button
                onClick={handleResetPassword}
                disabled={isResettingPassword || !newPassword}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 rounded-xl font-semibold text-white hover:from-red-600 hover:to-red-700 transition disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                {isResettingPassword ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-100 rounded-xl font-semibold text-gray-900 hover:bg-gray-200 transition active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

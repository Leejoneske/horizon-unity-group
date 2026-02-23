import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, Calendar, Clock, Key, Plus, Settings, AlertCircle, CheckCircle2, Trash2, Activity, Smartphone, Wallet } from 'lucide-react';
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
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-8 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center font-bold text-2xl text-white shadow-lg">
                {member.full_name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-2xl text-white">{member.full_name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${member.is_online ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <p className="text-sm text-white/90">{member.is_online ? 'Online Now' : 'Offline'}</p>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Quick Stats - 3 Column */}
          <div className="px-6 py-4 grid grid-cols-3 gap-3 bg-gray-50 border-b border-gray-200">
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-600 mb-1">Total Balance</p>
              <p className="text-2xl font-bold text-green-600">KES {effectiveBalance.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-600 mb-1">Contributions</p>
              <p className="text-2xl font-bold text-blue-600">{member.contribution_count}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-600 mb-1">Missed Days</p>
              <p className="text-2xl font-bold text-orange-600">{member.missed_contributions}</p>
            </div>
          </div>

          {/* Activity & Security Section */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Activity & Security
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold text-blue-600">Last Login</p>
                    <p className="text-sm font-medium text-gray-900">{lastLoginText}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between bg-purple-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs font-semibold text-purple-600">Phone Number</p>
                    <p className="text-sm font-medium text-gray-900">{member.phone_number || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              Financial Details
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-600 mb-2">Daily Amount</p>
                <p className="text-2xl font-bold text-emerald-700">KES {member.daily_contribution_amount.toLocaleString()}</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-600 mb-2">Total Contributions</p>
                <p className="text-2xl font-bold text-indigo-700">KES {member.total_contributions.toLocaleString()}</p>
              </div>
              <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                <p className="text-xs font-semibold text-violet-600 mb-2">Adjustments</p>
                <p className={`text-2xl font-bold ${member.balance_adjustment > 0 ? 'text-green-700' : member.balance_adjustment < 0 ? 'text-red-700' : 'text-gray-700'}`}>
                  {member.balance_adjustment > 0 ? '+' : ''}{member.balance_adjustment.toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-semibold text-slate-600 mb-2">Status</p>
                <p className="text-sm font-bold text-slate-700">{member.balance_visible ? 'Visible' : 'Hidden'}</p>
              </div>
            </div>
          </div>

          {/* Add Contribution */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-600" />
              Add Contribution
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contrib-date" className="text-sm font-semibold text-gray-700">Select Date</Label>
                <Input
                  id="contrib-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-lg border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contrib-amount" className="text-sm font-semibold text-gray-700">Amount (KES)</Label>
                <Input
                  id="contrib-amount"
                  type="number"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="rounded-lg border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <button
                onClick={handleAddContributionForDate}
                disabled={isAddingContrib || !selectedDate}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-semibold text-white hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" />
                {isAddingContrib ? 'Adding...' : 'Add Contribution'}
              </button>
            </div>
          </div>

          {/* Recent Contributions */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Recent Contributions
            </h4>
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">
                <div className="animate-pulse">Loading contributions...</div>
              </div>
            ) : contributions.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <p>No contributions recorded yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {contributions.slice(0, 10).map((contrib) => (
                  <div key={contrib.id} className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 hover:from-blue-100 hover:to-indigo-100 transition border border-blue-200">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{format(parseISO(contrib.contribution_date), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-gray-600">KES {contrib.amount.toLocaleString()}</p>
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

          {/* Security - Password Reset */}
          <div className="px-6 py-4">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-red-600" />
              Security & Authentication
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-semibold text-gray-700">Reset Password</Label>
                <p className="text-xs text-gray-500 mb-2">Create a new password for this member (minimum 6 characters)</p>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-lg border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <button
                onClick={handleResetPassword}
                disabled={isResettingPassword || !newPassword || newPassword.length < 6}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg font-semibold text-white hover:from-red-600 hover:to-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2 shadow-md"
              >
                <Key className="w-4 h-4" />
                {isResettingPassword ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200 flex gap-3 shadow-sm">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-50 hover:border-gray-400 transition active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

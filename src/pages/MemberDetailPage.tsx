import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Calendar, Clock, Key, Plus, Trash2, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

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

export default function MemberDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [member, setMember] = useState<Member | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [contributionAmount, setContributionAmount] = useState('100');
  const [isAddingContrib, setIsAddingContrib] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    if (userId) {
      fetchMemberDetails();
    }
  }, [userId, isAdmin, navigate]);

  const fetchMemberDetails = async () => {
    try {
      setIsLoading(true);

      // Fetch member profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileData) {
        const { data: contribData } = await supabase
          .from('contributions')
          .select('*')
          .eq('user_id', userId)
          .order('contribution_date', { ascending: false });

        const totalContribs = contribData ? contribData.reduce((sum, c) => sum + Number(c.amount), 0) : 0;

        setMember({
          id: profileData.id,
          user_id: profileData.user_id,
          full_name: profileData.full_name,
          phone_number: profileData.phone_number,
          total_contributions: totalContribs,
          contribution_count: contribData?.length || 0,
          balance_visible: profileData.balance_visible,
          daily_contribution_amount: profileData.daily_contribution_amount,
          balance_adjustment: profileData.balance_adjustment || 0,
          missed_contributions: profileData.missed_contributions || 0,
          last_login: profileData.last_login,
          is_online: profileData.is_online
        });

        if (contribData) {
          setContributions(contribData);
        }

        // Set contribution amount from member's daily amount
        if (profileData.daily_contribution_amount) {
          setContributionAmount(profileData.daily_contribution_amount.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load member details',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContributionForDate = async () => {
    if (!selectedDate || !member) {
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

      const { error } = await supabase
        .from('contributions')
        .insert({
          user_id: member.user_id,
          amount: Number(contributionAmount),
          contribution_date: selectedDate,
          status: 'completed',
          notes: 'Added by admin'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Contribution added for ${format(new Date(selectedDate), 'MMM d, yyyy')}`
      });

      setSelectedDate('');
      fetchMemberDetails();
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

  const handleRemoveContribution = async (contribId: string) => {
    try {
      const { error } = await supabase
        .from('contributions')
        .delete()
        .eq('id', contribId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Contribution removed'
      });

      fetchMemberDetails();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove contribution';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6 || !member) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsResettingPassword(true);
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

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading member details...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="w-screen h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Member not found</h2>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const effectiveBalance = member.total_contributions + (member.balance_adjustment || 0);
  const lastLoginDate = member.last_login ? new Date(member.last_login) : null;
  const lastLoginText = lastLoginDate ? format(lastLoginDate, 'MMM d, yyyy HH:mm') : 'Never';

  return (
    <div className="w-screen h-screen bg-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-2xl text-gray-900">{member.full_name}</h1>
            <p className="text-sm text-gray-500">{member.phone_number || 'No phone'}</p>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
        {/* Quick Stats */}
        <div className="px-4 pt-6 pb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200">
              <p className="text-xs font-semibold text-green-600 mb-2">Balance</p>
              <p className="text-2xl font-bold text-green-700">KES {effectiveBalance.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
              <p className="text-xs font-semibold text-blue-600 mb-2">Contributions</p>
              <p className="text-2xl font-bold text-blue-700">{member.contribution_count}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 border border-orange-200">
              <p className="text-xs font-semibold text-orange-600 mb-2">Missed</p>
              <p className="text-2xl font-bold text-orange-700">{member.missed_contributions}</p>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="px-4 pb-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Activity</h3>
          <div className="space-y-2">
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs font-semibold text-gray-600">Last Login</p>
                  <p className="text-sm font-medium text-gray-900">{lastLoginText}</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${member.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
          </div>
        </div>

        {/* Add Contribution */}
        <div className="px-4 pb-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Add Contribution</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="contrib-date" className="text-sm font-semibold text-gray-700">Date</Label>
              <Input
                id="contrib-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contrib-amount" className="text-sm font-semibold text-gray-700">Amount (KES)</Label>
              <Input
                id="contrib-amount"
                type="number"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                className="rounded-lg border-gray-200"
              />
            </div>
            <button
              onClick={handleAddContributionForDate}
              disabled={isAddingContrib || !selectedDate}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg font-semibold text-white hover:from-green-600 hover:to-green-700 transition disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isAddingContrib ? 'Adding...' : 'Add Contribution'}
            </button>
          </div>
        </div>

        {/* Recent Contributions */}
        <div className="px-4 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Recent Contributions</h3>
          {contributions.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              <p>No contributions recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {contributions.slice(0, 15).map((contrib) => (
                <div key={contrib.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition">
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

        {/* Password Reset */}
        <div className="px-4 py-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Reset Password</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-semibold text-gray-700">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-lg border-gray-200"
              />
            </div>
            <button
              onClick={handleResetPassword}
              disabled={isResettingPassword || !newPassword || newPassword.length < 6}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 rounded-lg font-semibold text-white hover:from-red-600 hover:to-red-700 transition disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              {isResettingPassword ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

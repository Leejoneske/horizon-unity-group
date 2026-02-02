import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Users, 
  TrendingUp, 
  Calendar, 
  LogOut,
  CheckCircle2,
  Clock,
  UserPlus
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Member {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string | null;
  total_contributions: number;
  contribution_count: number;
}

interface Contribution {
  id: string;
  amount: number;
  contribution_date: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
}

export default function AdminDashboard() {
  const { user, isAdmin, signOut, isLoading: authLoading } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [recentContributions, setRecentContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  const fetchData = async () => {
    try {
      // Fetch all profiles with their contribution totals
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

      // Fetch all contributions
      const { data: contributionsData } = await supabase
        .from('contributions')
        .select('*')
        .order('contribution_date', { ascending: false });

      if (profilesData && contributionsData) {
        const membersWithStats = profilesData.map(profile => {
          const memberContribs = contributionsData.filter(c => c.user_id === profile.user_id);
          return {
            ...profile,
            total_contributions: memberContribs.reduce((sum, c) => sum + Number(c.amount), 0),
            contribution_count: memberContribs.length
          };
        });
        setMembers(membersWithStats);

        // Get recent contributions with profile names
        const recentWithNames = contributionsData.slice(0, 20).map(c => {
          const profile = profilesData.find(p => p.user_id === c.user_id);
          return {
            ...c,
            profiles: profile ? { full_name: profile.full_name } : null
          };
        });
        setRecentContributions(recentWithNames);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleAddAdmin = async () => {
    setIsAddingMember(true);
    try {
      // This would typically invite a new admin
      // For now, just show a message
      toast({
        title: 'Feature coming soon',
        description: 'Admin invitation system will be available soon.',
      });
      setAddMemberOpen(false);
      setNewMemberEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsAddingMember(false);
    }
  };

  const currentMonth = new Date();
  const thisMonthContribs = recentContributions.filter(c => {
    const date = parseISO(c.contribution_date);
    return date >= startOfMonth(currentMonth) && date <= endOfMonth(currentMonth);
  });

  const totalGroupSavings = members.reduce((sum, m) => sum + m.total_contributions, 0);
  const thisMonthTotal = thisMonthContribs.reduce((sum, c) => sum + Number(c.amount), 0);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Admin Dashboard</p>
              <p className="text-xs text-muted-foreground">Horizon Unit Management</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="finance-card">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="stat-label">Members</span>
            </div>
            <p className="stat-value">{members.length}</p>
          </div>
          <div className="finance-card">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="stat-label">Total Savings</span>
            </div>
            <p className="stat-value text-xl lg:text-3xl">KES {totalGroupSavings.toLocaleString()}</p>
          </div>
          <div className="finance-card">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="stat-label">This Month</span>
            </div>
            <p className="stat-value text-xl lg:text-3xl">KES {thisMonthTotal.toLocaleString()}</p>
          </div>
          <div className="finance-card">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="stat-label">Contributions</span>
            </div>
            <p className="stat-value">{thisMonthContribs.length}</p>
          </div>
        </div>

        {/* Members List */}
        <div className="finance-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Members
            </h3>
            <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Admin</DialogTitle>
                  <DialogDescription>
                    Send an invitation to a new admin member.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email Address</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@example.com"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddAdmin} disabled={isAddingMember} className="w-full">
                    Send Invitation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No members yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Member</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Phone</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Contributions</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Total Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {member.full_name?.charAt(0) || 'M'}
                            </span>
                          </div>
                          <span className="font-medium">{member.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm">
                        {member.phone_number || '-'}
                      </td>
                      <td className="py-3 px-2 text-right">{member.contribution_count}</td>
                      <td className="py-3 px-2 text-right font-semibold amount-positive">
                        KES {member.total_contributions.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Contributions */}
        <div className="finance-card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Contributions
          </h3>
          
          {recentContributions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No contributions yet.</p>
          ) : (
            <div className="space-y-3">
              {recentContributions.slice(0, 15).map((contribution) => (
                <div key={contribution.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      contribution.status === 'completed' ? 'bg-primary/10' : 'bg-warning/10'
                    }`}>
                      {contribution.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <Clock className="w-4 h-4 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {contribution.profiles?.full_name || 'Unknown Member'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(contribution.contribution_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold amount-positive">
                    +KES {Number(contribution.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

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
  UserPlus,
  BarChart3
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
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

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
  const avgPerMember = members.length > 0 ? totalGroupSavings / members.length : 0;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="app-header sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Admin Dashboard</p>
              <p className="text-xs text-muted-foreground">Horizon Unit Management</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Main Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Group Savings */}
          <div className="finance-card md:col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium text-foreground">Group Total Savings</span>
            </div>
            <p className="balance-display mb-1 text-primary">KES {totalGroupSavings.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">All members combined</p>
          </div>

          {/* Active Members */}
          <div className="finance-card bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <span className="font-medium text-muted-foreground">Active Members</span>
            </div>
            <p className="stat-value text-accent">{members.length}</p>
            <p className="text-sm text-muted-foreground">Group members</p>
          </div>

          {/* This Month */}
          <div className="finance-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="font-medium text-muted-foreground">This Month</span>
            </div>
            <p className="stat-value">KES {thisMonthTotal.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{thisMonthContribs.length} contributions</p>
          </div>

          {/* Average Per Member */}
          <div className="finance-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="font-medium text-muted-foreground">Avg Per Member</span>
            </div>
            <p className="stat-value">KES {avgPerMember.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Average savings</p>
          </div>
        </div>

        {/* Members Table */}
        <div className="finance-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              Members
            </h3>
            <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
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
                      className="rounded-full"
                    />
                  </div>
                  <Button onClick={handleAddAdmin} disabled={isAddingMember} className="w-full rounded-full">
                    Send Invitation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {members.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No members yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Member</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Phone</th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">Contributions</th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">Total Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors last:border-0">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/15 to-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {member.full_name?.charAt(0) || 'M'}
                            </span>
                          </div>
                          <span className="font-medium">{member.full_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {member.phone_number || '-'}
                      </td>
                      <td className="py-4 px-4 text-right font-medium">{member.contribution_count}</td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold amount-positive">KES {member.total_contributions.toLocaleString()}</span>
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
          <h3 className="font-semibold text-lg mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            Recent Contributions
          </h3>
          
          {recentContributions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No contributions yet</p>
            </div>
          ) : (
            <div className="space-y-2 divide-y divide-border/50">
              {recentContributions.slice(0, 20).map((contribution) => (
                <div key={contribution.id} className="flex items-center justify-between py-4 first:pt-0">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      contribution.status === 'completed' ? 'bg-accent/15' : 'bg-warning/15'
                    }`}>
                      {contribution.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-accent" />
                      ) : (
                        <Clock className="w-6 h-6 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {contribution.profiles?.full_name || 'Unknown Member'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(contribution.contribution_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-lg amount-positive flex-shrink-0">
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

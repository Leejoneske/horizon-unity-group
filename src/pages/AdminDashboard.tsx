import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';
import logo from '@/assets/logo.png';
import StatsOverview from '@/components/admin/StatsOverview';
import MemberManagement from '@/components/admin/MemberManagement';
import MessageCenter from '@/components/admin/MessageCenter';
import RecentContributions from '@/components/admin/RecentContributions';

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
  const navigate = useNavigate();

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
      // Fetch all profiles and user roles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Fetch all contributions
      const { data: contributionsData } = await supabase
        .from('contributions')
        .select('*')
        .order('contribution_date', { ascending: false });

      if (profilesData && contributionsData && rolesData) {
        // Filter out admins from members list
        const adminUserIds = rolesData
          .filter(role => role.role === 'admin')
          .map(role => role.user_id);

        const regularMembers = profilesData.filter(
          profile => !adminUserIds.includes(profile.user_id)
        );

        const membersWithStats = regularMembers.map(profile => {
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
            profiles: profile ? { full_name: profile.full_name, balance_visible: profile.balance_visible } : null
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

  const currentMonth = new Date();
  const thisMonthContribs = recentContributions.filter(c => {
    const date = parseISO(c.contribution_date);
    return date >= startOfMonth(currentMonth) && date <= endOfMonth(currentMonth);
  });

  const totalGroupSavings = members.reduce((sum, m) => sum + m.total_contributions + (m.balance_adjustment || 0), 0);
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
            <img src={logo} alt="Horizon Unit" className="w-10 h-10 object-contain" />
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
        <StatsOverview
          membersCount={members.length}
          totalGroupSavings={totalGroupSavings}
          thisMonthTotal={thisMonthTotal}
          thisMonthContribsCount={thisMonthContribs.length}
        />

        {/* Member Management */}
        <MemberManagement 
          members={members} 
          onRefresh={fetchData} 
          adminId={user!.id} 
        />

        {/* Message Center */}
        <MessageCenter 
          adminId={user!.id} 
          members={members.map(m => ({ user_id: m.user_id, full_name: m.full_name }))} 
        />

        {/* Recent Contributions */}
        <RecentContributions contributions={recentContributions} />
      </main>
    </div>
  );
}

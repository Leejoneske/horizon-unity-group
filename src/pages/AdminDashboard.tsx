import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { LogOut, Users, TrendingUp, Calendar, MessageSquare, Bell } from 'lucide-react';
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
  profiles: { full_name: string } | null;
}

export default function AdminDashboard() {
  const { user, isAdmin, signOut, isLoading: authLoading } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [recentContributions, setRecentContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'messages'>('overview');
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/dashboard'); }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) fetchData();
  }, [user, isAdmin]);

  const fetchData = async () => {
    try {
      const { data: profilesData } = await supabase.from('profiles').select('*');
      const { data: contributionsData } = await supabase.from('contributions').select('*').order('contribution_date', { ascending: false });

      if (profilesData && contributionsData) {
        const nonAdminProfiles = profilesData.filter(profile => profile.user_id !== user?.id);
        const membersWithStats = nonAdminProfiles.map(profile => {
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
          return { ...c, profiles: profile ? { full_name: profile.full_name } : null };
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl rounded-3xl overflow-hidden flex flex-col">
        
        {/* Drag Handle - Premium mobile feel */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <img src={logo} alt="Horizon Unit" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <p className="text-gray-600 text-xs font-bold uppercase">Admin</p>
              <p className="font-bold text-gray-900 text-sm">Horizon Unit</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition active:scale-95">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={handleSignOut} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition active:scale-95">
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Main Content Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-6 pb-4 space-y-5">
            {/* Hero Stats Section */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-3xl p-6 text-white shadow-xl border border-blue-500/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs opacity-75 font-semibold uppercase mb-1">Total Assets</p>
                  <p className="text-5xl font-bold tracking-tight">KES {totalGroupSavings.toLocaleString()}</p>
                </div>
                <span className="text-xs bg-white/20 backdrop-blur px-3 py-1.5 rounded-full font-semibold">{members.length} Members</span>
              </div>
              <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs opacity-75 font-semibold">This Month</p>
                  <p className="text-2xl font-bold mt-1">KES {thisMonthTotal.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs opacity-75 font-semibold">Contributions</p>
                  <p className="text-2xl font-bold mt-1">{thisMonthContribs.length}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setActiveTab('members')} className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:from-blue-100 hover:to-blue-50 transition active:scale-95 border border-blue-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-gray-900 uppercase">Members</span>
              </button>
              <button onClick={() => setActiveTab('messages')} className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:from-green-100 hover:to-green-50 transition active:scale-95 border border-green-100 shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-bold text-gray-900 uppercase">Messages</span>
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-4 border border-blue-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-600 font-bold uppercase">Members</span>
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-3 h-3 text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{members.length}</p>
                <p className="text-xs text-gray-600 mt-1 font-medium">Active in group</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-4 border border-green-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-600 font-bold uppercase">This Month</span>
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">KES {(thisMonthTotal / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-600 mt-1 font-medium">Total collected</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-4 border border-purple-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-600 font-bold uppercase">Contributions</span>
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-3 h-3 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{thisMonthContribs.length}</p>
                <p className="text-xs text-gray-600 mt-1 font-medium">This period</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-4 border border-orange-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-600 font-bold uppercase">Per Member</span>
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-orange-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">KES {members.length > 0 ? (thisMonthTotal / members.length).toFixed(0) : 0}</p>
                <p className="text-xs text-gray-600 mt-1 font-medium">Average amount</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-full sticky top-0 z-10 shadow-sm">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 px-4 rounded-full text-xs font-bold uppercase transition-all ${
                  activeTab === 'overview' 
                    ? 'bg-white text-gray-900 shadow-md' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex-1 py-2 px-4 rounded-full text-xs font-bold uppercase transition-all ${
                  activeTab === 'members' 
                    ? 'bg-white text-gray-900 shadow-md' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Members
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`flex-1 py-2 px-4 rounded-full text-xs font-bold uppercase transition-all ${
                  activeTab === 'messages' 
                    ? 'bg-white text-gray-900 shadow-md' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Messages
              </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-3">
              {activeTab === 'overview' && (
                <RecentContributions contributions={recentContributions} />
              )}

              {activeTab === 'members' && (
                <MemberManagement members={members} onRefresh={fetchData} adminId={user!.id} />
              )}

              {activeTab === 'messages' && (
                <MessageCenter adminId={user!.id} members={members.map(m => ({ user_id: m.user_id, full_name: m.full_name }))} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { 
  LogOut, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Settings,
  ChevronRight,
  Search,
  X
} from 'lucide-react';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';
import logo from '@/assets/logo.png';
import MemberManagement from '@/components/admin/MemberManagement';
import MessageCenter from '@/components/admin/MessageCenter';

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
  const [showStatsCard, setShowStatsCard] = useState(true);
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
    try {
      await signOut();
      navigate('/admin/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      // Force navigate even if signOut fails
      navigate('/admin/login', { replace: true });
    }
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
      <div className="w-screen h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-white overflow-hidden flex flex-col">
      {/* Mobile Container */}
      <div className="w-full h-full bg-white overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
          {/* Profile Avatar */}
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-md border border-gray-100">
              <img src={logo} alt="Admin" className="w-10 h-10 object-contain" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button className="px-5 py-2.5 bg-gray-100 rounded-full text-sm font-medium text-gray-900 hover:bg-gray-200 transition">
              Admin
            </button>
            <button 
              onClick={handleSignOut}
              className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Balance Card */}
          <div className="px-4 pt-6 pb-4">
            <div className="bg-gray-100 rounded-3xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-1">Horizon</h2>
                  <p className="text-2xl text-gray-400 font-medium">KES {totalGroupSavings.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="px-4 pb-6">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setActiveTab('members')}
                className="bg-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-gray-200 transition active:scale-95"
              >
                <Users className="w-8 h-8 text-gray-700" />
                <span className="text-base font-semibold text-gray-900">Members</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('messages')}
                className="bg-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-gray-200 transition active:scale-95"
              >
                <MessageSquare className="w-8 h-8 text-gray-700" />
                <span className="text-base font-semibold text-gray-900">Messages</span>
              </button>
            </div>
          </div>

          {/* Stats Card */}
          {showStatsCard && (
            <div className="px-4 pb-6">
              <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-3xl p-6 relative overflow-hidden">
                <button 
                  className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition"
                  onClick={() => setShowStatsCard(false)}
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
                
                {/* Stats Icons */}
                <div className="flex gap-2 mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-300 to-green-400 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                    <span className="text-2xl font-bold text-white">{members.length}</span>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-green-300 to-green-400 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-green-300 to-green-400 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Text */}
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-gray-900">This month,</h3>
                  <h3 className="text-2xl font-bold text-gray-900">KES {thisMonthTotal.toLocaleString()} collected.</h3>
                  <p className="text-xl font-semibold text-gray-900">{thisMonthContribs.length} contributions</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content Based on Active Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Today Section - Recent Activity */}
              <div className="px-4 pb-4">
                <h3 className="text-lg font-semibold text-gray-600 mb-4">Recent Activity</h3>
                
                {recentContributions.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Activity feed</h3>
                    <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                      When members add contributions, they show up here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentContributions.slice(0, 8).map((contribution) => (
                      <div key={contribution.id} className="bg-gray-100 rounded-2xl p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center text-white font-bold">
                            {contribution.profiles?.full_name?.substring(0, 2).toUpperCase() || '??'}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{contribution.profiles?.full_name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{format(parseISO(contribution.contribution_date), 'MMM d, yyyy')}</p>
                          </div>
                          <span className="font-bold text-green-600">+KES {Number(contribution.amount).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Member Summary */}
              <div className="px-4 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-600">Members</h3>
                  <button 
                    onClick={() => setActiveTab('members')}
                    className="text-sm font-medium text-blue-600 flex items-center gap-1 hover:text-blue-700"
                  >
                    View all <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {members.slice(0, 4).map((member) => (
                    <div key={member.id} className="bg-gray-100 rounded-2xl p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white font-bold">
                          {member.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{member.full_name}</p>
                          <p className="text-sm text-gray-500">{member.contribution_count} contributions</p>
                        </div>
                        <span className="font-bold text-gray-900">KES {(member.total_contributions + (member.balance_adjustment || 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'members' && (
            <div className="px-4 pb-6">
              <MemberManagement members={members} onRefresh={fetchData} adminId={user!.id} />
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="px-4 pb-6">
              <MessageCenter adminId={user!.id} members={members.map(m => ({ user_id: m.user_id, full_name: m.full_name }))} />
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="bg-white border-t border-gray-200">
          <div className="px-4 py-3">
            <p className="text-center text-sm text-gray-600 mb-3">
              Manage <span className="font-semibold">{members.length} members</span> and{' '}
              <span className="font-semibold">KES {totalGroupSavings.toLocaleString()}</span> in savings.
            </p>
            
            <div className="grid grid-cols-3 gap-2 pb-2">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-4 rounded-full text-sm font-semibold transition active:scale-95 ${
                  activeTab === 'overview' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('members')}
                className={`py-3 px-4 rounded-full text-sm font-semibold transition active:scale-95 ${
                  activeTab === 'members' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Members
              </button>
              <button 
                onClick={() => setActiveTab('messages')}
                className={`py-3 px-4 rounded-full text-sm font-semibold transition active:scale-95 ${
                  activeTab === 'messages' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Messages
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

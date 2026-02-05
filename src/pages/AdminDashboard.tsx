 import { useEffect, useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/lib/auth';
 import { Button } from '@/components/ui/button';
 import { LogOut, Users, TrendingUp, Calendar, MessageSquare, Settings, ChevronRight, Sparkles, BarChart3, Bell, Plus } from 'lucide-react';
 import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';
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
         {/* Header */}
         <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
           <div className="flex items-center gap-3">
             <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
               <img src={logo} alt="Horizon Unit" className="w-8 h-8 object-contain" />
             </div>
             <div>
               <p className="text-gray-600 text-xs font-medium">Admin</p>
               <p className="font-bold text-gray-900">Horizon Unit</p>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
               <Bell className="w-5 h-5 text-gray-600" />
             </button>
             <button onClick={handleSignOut} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
               <LogOut className="w-5 h-5 text-gray-600" />
             </button>
           </div>
         </div>

         {/* Main Content Scrollable */}
         <div className="flex-1 overflow-y-auto">
           <div className="px-4 pt-6 pb-4 space-y-4">
             {/* Total Group Savings Card */}
             <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 text-white">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-sm">Total Group Savings</h3>
                 <span className="text-xs bg-white/20 px-3 py-1 rounded-full">{members.length} Members</span>
               </div>
               <p className="text-4xl font-bold tracking-tight">KES {totalGroupSavings.toLocaleString()}</p>
               <div className="mt-4 pt-4 border-t border-white/20 flex gap-4">
                 <div className="flex-1">
                   <p className="text-xs opacity-75">This Month</p>
                   <p className="text-lg font-bold">KES {thisMonthTotal.toLocaleString()}</p>
                 </div>
                 <div className="flex-1">
                   <p className="text-xs opacity-75">Contributions</p>
                   <p className="text-lg font-bold">{thisMonthContribs.length}</p>
                 </div>
               </div>
             </div>
 
             {/* Quick Actions Grid */}
             <div className="grid grid-cols-3 gap-3">
               <button onClick={() => setActiveTab('members')} className="bg-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-gray-200 transition">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                   <Users className="w-5 h-5 text-blue-600" />
                 </div>
                 <span className="text-xs font-semibold text-gray-900">Members</span>
               </button>
               <button onClick={() => setActiveTab('messages')} className="bg-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-gray-200 transition">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                   <MessageSquare className="w-5 h-5 text-blue-600" />
                 </div>
                 <span className="text-xs font-semibold text-gray-900">Messages</span>
               </button>
               <button onClick={() => setActiveTab('overview')} className="bg-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-gray-200 transition">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                   <BarChart3 className="w-5 h-5 text-blue-600" />
                 </div>
                 <span className="text-xs font-semibold text-gray-900">Reports</span>
               </button>
             </div>

             {/* Stats Cards */}
             <div className="space-y-3">
               <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-xs text-gray-600 font-medium">Active Members</span>
                   <Users className="w-4 h-4 text-blue-600" />
                 </div>
                 <p className="text-3xl font-bold text-gray-900">{members.length}</p>
               </div>
               <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-xs text-gray-600 font-medium">This Month</span>
                   <TrendingUp className="w-4 h-4 text-green-600" />
                 </div>
                 <p className="text-3xl font-bold text-gray-900">KES {(thisMonthTotal / 1000).toFixed(0)}K</p>
               </div>
               <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-xs text-gray-600 font-medium">Contributions</span>
                   <Calendar className="w-4 h-4 text-blue-600" />
                 </div>
                 <p className="text-3xl font-bold text-gray-900">{thisMonthContribs.length}</p>
               </div>
             </div>

             {/* Tab Navigation */}
             <div className="flex gap-2 bg-gray-100 p-1 rounded-full sticky top-0 z-10">
               <button
                 onClick={() => setActiveTab('overview')}
                 className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
                   activeTab === 'overview' 
                     ? 'bg-white text-gray-900 shadow-md' 
                     : 'text-gray-600 hover:text-gray-900'
                 }`}
               >
                 Overview
               </button>
               <button
                 onClick={() => setActiveTab('members')}
                 className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
                   activeTab === 'members' 
                     ? 'bg-white text-gray-900 shadow-md' 
                     : 'text-gray-600 hover:text-gray-900'
                 }`}
               >
                 Members
               </button>
               <button
                 onClick={() => setActiveTab('messages')}
                 className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
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
                 <div className="bg-white border border-gray-100 rounded-2xl p-4">
                   <RecentContributions contributions={recentContributions} />
                 </div>
               )}

               {activeTab === 'members' && (
                 <div className="bg-white border border-gray-100 rounded-2xl p-4">
                   <MemberManagement members={members} onRefresh={fetchData} adminId={user!.id} />
                 </div>
               )}

               {activeTab === 'messages' && (
                 <div className="bg-white border border-gray-100 rounded-2xl p-4">
                   <MessageCenter adminId={user!.id} members={members.map(m => ({ user_id: m.user_id, full_name: m.full_name }))} />
                 </div>
               )}
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }
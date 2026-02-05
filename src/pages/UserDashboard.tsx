 import { useEffect, useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/lib/auth';
 import { Button } from '@/components/ui/button';
 import { 
   TrendingUp, 
   Calendar, 
   LogOut, 
   Plus,
   CheckCircle2,
   Clock,
   Wallet,
   EyeOff,
   Bell,
   AlertCircle,
   Info,
   Eye,
   History,
   Target,
   ChevronRight,
   Sparkles
 } from 'lucide-react';
 import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, differenceInDays, startOfDay } from 'date-fns';
 import { useToast } from '@/hooks/use-toast';
 import logo from '@/assets/logo.png';
 
 interface Contribution {
   id: string;
   amount: number;
   contribution_date: string;
   status: string;
   notes: string | null;
   created_at: string;
 }
 
 interface Profile {
   full_name: string;
   phone_number: string | null;
   balance_visible: boolean;
   daily_contribution_amount: number;
   balance_adjustment: number;
   missed_contributions: number;
 }
 
 interface AdminMessage {
   id: string;
   message: string;
   message_type: string;
   is_read: boolean;
   created_at: string;
 }
 
 export default function UserDashboard() {
   const { user, signOut, isAdmin, isLoading: authLoading } = useAuth();
   const [contributions, setContributions] = useState<Contribution[]>([]);
   const [profile, setProfile] = useState<Profile | null>(null);
   const [messages, setMessages] = useState<AdminMessage[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [currentMonth, setCurrentMonth] = useState(new Date());
   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
   const [showBalance, setShowBalance] = useState(false);
   const navigate = useNavigate();
   const { toast } = useToast();
 
   useEffect(() => {
     if (!authLoading && !user) {
       navigate('/login');
     } else if (user && !authLoading) {
       if (isAdmin) {
         navigate('/admin/dashboard', { replace: true });
         return;
       }
       fetchData();
     }
   }, [user, isAdmin, authLoading, navigate]);
 
   const fetchData = async () => {
     try {
       const [contribRes, profileRes, messagesRes] = await Promise.all([
         supabase
           .from('contributions')
           .select('*')
           .eq('user_id', user!.id)
           .order('contribution_date', { ascending: false }),
         supabase
           .from('profiles')
           .select('full_name, phone_number, balance_visible, daily_contribution_amount, balance_adjustment, missed_contributions')
           .eq('user_id', user!.id)
           .single(),
         supabase
           .from('admin_messages')
           .select('*')
           .eq('user_id', user!.id)
           .order('created_at', { ascending: false })
           .limit(5)
       ]);
 
       if (contribRes.data) setContributions(contribRes.data);
       if (profileRes.data) setProfile(profileRes.data);
       if (messagesRes.data) setMessages(messagesRes.data);
     } catch (error) {
       console.error('Error fetching data:', error);
     } finally {
       setIsLoading(false);
     }
   };
 
   const calculateMissedDays = () => {
     if (contributions.length === 0) return 0;
     const today = startOfDay(new Date());
     const yesterday = startOfDay(new Date(today.getTime() - 24 * 60 * 60 * 1000));
     const contributionDates = contributions.map(c => startOfDay(parseISO(c.contribution_date)));
     const earliestContrib = contributionDates[contributionDates.length - 1];
     const totalDays = Math.max(0, differenceInDays(yesterday, earliestContrib) + 1);
     const contributedDays = contributions.length;
     return Math.max(0, totalDays - contributedDays);
   };
 
   const handleAddContribution = async () => {
     try {
       const today = format(new Date(), 'yyyy-MM-dd');
       const existingToday = contributions.find(c => c.contribution_date === today);
       
       if (existingToday) {
         toast({ title: 'Already contributed', description: 'You have already made a contribution today.', variant: 'destructive' });
         return;
       }
 
       const dailyAmount = profile?.daily_contribution_amount || 100;
 
       const { error } = await supabase
         .from('contributions')
         .insert({ user_id: user!.id, amount: dailyAmount, contribution_date: today, status: 'completed', notes: null });
 
       if (error) throw error;
 
       toast({ title: 'Contribution added!', description: `KES ${dailyAmount.toLocaleString()} has been recorded for today.` });
       fetchData();
     } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to add contribution';
       toast({ title: 'Error', description: message, variant: 'destructive' });
     }
   };
 
   const handleAddContributionForDate = async (date: Date) => {
     try {
       const dateStr = format(date, 'yyyy-MM-dd');
       const today = format(new Date(), 'yyyy-MM-dd');
       const existingContrib = contributions.find(c => c.contribution_date === dateStr);
       
       if (existingContrib) {
         toast({ title: 'Already contributed', description: `You have already made a contribution for ${format(date, 'MMM d, yyyy')}.`, variant: 'destructive' });
         return;
       }
 
       if (dateStr > today) {
         toast({ title: 'Invalid date', description: 'You cannot contribute for future dates.', variant: 'destructive' });
         return;
       }
 
       const dailyAmount = profile?.daily_contribution_amount || 100;
 
       const { error } = await supabase
         .from('contributions')
         .insert({ user_id: user!.id, amount: dailyAmount, contribution_date: dateStr, status: 'completed', notes: null });
 
       if (error) throw error;
 
       toast({ title: 'Contribution added!', description: `KES ${dailyAmount.toLocaleString()} recorded for ${format(date, 'MMM d, yyyy')}.` });
       setSelectedDate(null);
       fetchData();
     } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to add contribution';
       toast({ title: 'Error', description: message, variant: 'destructive' });
     }
   };
 
   const handleMarkMessageRead = async (messageId: string) => {
     try {
       await supabase.from('admin_messages').update({ is_read: true }).eq('id', messageId);
       setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_read: true } : m));
     } catch (error) {
       console.error('Error marking message as read:', error);
     }
   };
 
   const handleSignOut = async () => {
     await signOut();
     navigate('/login');
   };
 
   const totalContributions = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
   const effectiveBalance = totalContributions + (profile?.balance_adjustment || 0);
   const thisMonthContributions = contributions.filter(c => {
     const date = parseISO(c.contribution_date);
     return date >= startOfMonth(currentMonth) && date <= endOfMonth(currentMonth);
   });
 
   const daysInMonth = eachDayOfInterval({
     start: startOfMonth(currentMonth),
     end: endOfMonth(currentMonth)
   });
 
   const hasContributedOnDay = (day: Date) => contributions.some(c => isSameDay(parseISO(c.contribution_date), day));
   const missedDays = calculateMissedDays();
   const dailyAmount = profile?.daily_contribution_amount || 100;
   const unreadMessages = messages.filter(m => !m.is_read);
 
   const getMessageIcon = (type: string) => {
     switch (type) {
       case 'warning': return <AlertCircle className="w-4 h-4 text-warning" />;
       case 'announcement': return <Bell className="w-4 h-4 text-primary" />;
       default: return <Info className="w-4 h-4 text-muted-foreground" />;
     }
   };
 
   if (authLoading || isLoading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <div className="animate-pulse text-muted-foreground">Loading...</div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-white flex items-center justify-center p-4">
       {/* Mobile Container */}
       <div className="w-full max-w-md bg-white min-h-screen shadow-2xl rounded-3xl overflow-hidden flex flex-col">
         
         {/* Drag Handle - Premium mobile feel */}
         <div className="flex justify-center pt-3 pb-1">
           <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
         </div>

         {/* Header */}
         <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
           {/* Profile Avatar */}
           <div className="relative">
             <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
               {profile?.full_name?.substring(0, 2).toUpperCase() || 'MN'}
             </div>
             {unreadMessages.length > 0 && (
               <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-400 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                 <div className="w-2 h-2 bg-white rounded-full"></div>
               </div>
             )}
           </div>

           {/* Action Buttons */}
           <div className="flex items-center gap-2">
             <button className="px-5 py-2.5 bg-gray-100 rounded-full text-sm font-medium text-gray-900 hover:bg-gray-200 transition active:scale-95">
               View
             </button>
             <button onClick={handleSignOut} className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition active:scale-95">
               <LogOut className="w-5 h-5 text-gray-600" />
             </button>
           </div>
         </div>

         {/* Main Content - Scrollable */}
         <div className="flex-1 overflow-y-auto">
           {/* Scrollable Content Area */}
           <div className="px-4 pt-6 pb-4">
           {/* Balance Card */}
           <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl p-6 mb-6 border border-gray-200">
             <div className="flex items-start justify-between">
               <div>
                 <p className="text-xs text-gray-600 font-semibold uppercase letter-spacing mb-2">Balance</p>
                 <h2 className="text-4xl font-bold text-gray-900 mb-1">{profile?.full_name?.split(' ')[0] || 'User'}</h2>
                 <p className="text-2xl text-gray-500 font-semibold">
                   {showBalance && profile?.balance_visible ? `KES ${effectiveBalance.toLocaleString()}` : 'KES ****'}
                 </p>
               </div>
               <button 
                 onClick={() => profile?.balance_visible && setShowBalance(!showBalance)}
                 className="p-2 hover:bg-gray-200 rounded-lg transition active:scale-95"
               >
                 <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
                   <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                   <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
                 </svg>
               </button>
             </div>
           </div>

           {/* Quick Stats */}
           <div className="space-y-3 mb-6">
             <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-4 border border-gray-200">
               <div className="flex items-center justify-between mb-3">
                 <span className="text-xs text-gray-600 font-bold uppercase">This Month</span>
                 <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                   <TrendingUp className="w-4 h-4 text-blue-600" />
                 </div>
               </div>
               <p className="text-3xl font-bold text-gray-900">{thisMonthContributions.length}</p>
               <p className="text-xs text-gray-600 mt-2 font-medium">KES {thisMonthContributions.reduce((sum, c) => sum + Number(c.amount), 0).toLocaleString()}</p>
             </div>
             <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-4 border border-gray-200">
               <div className="flex items-center justify-between mb-3">
                 <span className="text-xs text-gray-600 font-bold uppercase">Daily Target</span>
                 <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                   <Target className="w-4 h-4 text-green-600" />
                 </div>
               </div>
               <p className="text-3xl font-bold text-gray-900">KES {dailyAmount}</p>
               <p className="text-xs text-gray-600 mt-2 font-medium">Next contribution</p>
             </div>
           </div>

           {/* Action Buttons Grid */}
           <div className="grid grid-cols-2 gap-3 mb-6">
             <button 
               onClick={handleAddContribution}
               className="bg-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-gray-200 transition active:scale-95"
             >
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                 <Plus className="w-5 h-5 text-gray-900" />
               </div>
               <span className="text-sm font-semibold text-gray-900">Add Today</span>
             </button>
             
             <button className="bg-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-gray-200 transition active:scale-95">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                 <History className="w-5 h-5 text-gray-900" />
               </div>
               <span className="text-sm font-semibold text-gray-900">History</span>
             </button>
           </div>

           {/* Messages */}
           {unreadMessages.length > 0 && (
             <div className="mb-6">
               <h3 className="text-lg font-bold text-gray-900 mb-3">Messages</h3>
               <div className="space-y-3">
                 {unreadMessages.map(message => (
                   <div 
                     key={message.id}
                     onClick={() => handleMarkMessageRead(message.id)}
                     className={`border-l-4 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${
                       message.message_type === 'warning' 
                         ? 'border-l-amber-500 bg-amber-50' 
                         : 'border-l-blue-500 bg-blue-50'
                     }`}
                   >
                     <p className="font-semibold text-gray-900">{message.message}</p>
                     <p className="text-xs text-gray-500 mt-1">{format(parseISO(message.created_at), 'MMM d, HH:mm')}</p>
                   </div>
                 ))}
               </div>
             </div>
           )}

           {/* Missed Days Alert */}
           {missedDays > 0 && (
             <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
               <div>
                 <p className="font-bold text-amber-900">Catch Up on Contributions</p>
                 <p className="text-sm text-amber-800 mt-1">{missedDays} day{missedDays > 1 ? 's' : ''} pending</p>
               </div>
             </div>
           )}

           {/* Calendar View */}
           <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-lg text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h3>
             </div>
             
             <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-600 mb-4">
               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                 <div key={i} className="py-2">{day}</div>
               ))}
             </div>
             
             <div className="grid grid-cols-7 gap-2">
               {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                 <div key={`empty-${i}`} className="aspect-square" />
               ))}
               {daysInMonth.map((day) => {
                 const contributed = hasContributedOnDay(day);
                 const isToday = isSameDay(day, new Date());
                 const isFuture = day > startOfDay(new Date());
                 return (
                   <button
                     key={day.toISOString()}
                     onClick={() => !contributed && !isFuture && setSelectedDate(day)}
                     disabled={isFuture}
                     className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                       contributed 
                         ? 'bg-blue-600 text-white' 
                         : isToday 
                           ? 'bg-blue-100 text-blue-900 border-2 border-blue-600' 
                           : isFuture
                             ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                             : 'bg-gray-50 text-gray-600 hover:bg-blue-100 border border-gray-200'
                     }`}
                   >
                     {format(day, 'd')}
                   </button>
                 );
               })}
             </div>
             <p className="text-xs text-gray-500 mt-5 text-center font-medium">Click any past date to add contribution</p>
           </div>

           {/* Recent Activity */}
           <div className="mb-6">
             <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
             {contributions.length === 0 ? (
               <div className="text-center py-8 bg-gray-50 rounded-2xl">
                 <Wallet className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                 <p className="font-semibold text-gray-900">No contributions yet</p>
                 <p className="text-xs text-gray-500 mt-1">Start your savings journey today</p>
               </div>
             ) : (
               <div className="space-y-3">
                 {contributions.slice(0, 5).map((contribution) => (
                   <div key={contribution.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                     <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-lg ${
                         contribution.status === 'completed' ? 'bg-blue-100' : 'bg-amber-100'
                       }`}>
                         {contribution.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-blue-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
                       </div>
                       <div>
                         <p className="font-semibold text-gray-900 text-sm">{contribution.notes || 'Daily Contribution'}</p>
                         <p className="text-xs text-gray-500">{format(parseISO(contribution.contribution_date), 'MMM d, yyyy')}</p>
                       </div>
                     </div>
                     <span className="font-bold text-blue-600">+KES {Number(contribution.amount).toLocaleString()}</span>
                   </div>
                 ))}
               </div>
             )}
           </div>
           </div>
         </div>

         {/* Bottom Action Buttons - Fixed */}
         <div className="bg-white border-t border-gray-200">
           <div className="px-4 py-4">
             <p className="text-center text-xs text-gray-600 mb-4 leading-relaxed">
               Keep your savings on track. <span className="font-bold">Add your daily contribution</span> to stay committed to your goals.
             </p>
             
             <div className="grid grid-cols-2 gap-3 pb-3">
               <button 
                 className="py-3.5 px-6 bg-gray-100 rounded-full text-sm font-bold text-gray-900 hover:bg-gray-200 transition active:scale-95 uppercase letter-spacing"
               >
                 View
               </button>
               <button 
                 onClick={handleAddContribution}
                 className="py-3.5 px-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full text-sm font-bold text-white hover:from-orange-600 hover:to-orange-700 transition shadow-lg shadow-orange-500/30 active:scale-95 uppercase letter-spacing"
               >
                 Add
               </button>
             </div>
           </div>
         </div>
       </div>

       {/* Contribution Dialog Modal */}
       {selectedDate && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
             <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
             <div className="text-center mb-6">
               <div className="w-16 h-16 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center">
                 <Plus className="w-8 h-8 text-blue-600" />
               </div>
               <h3 className="font-bold text-xl text-gray-900">Add Contribution</h3>
               <p className="text-gray-600 text-sm mt-2">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
             </div>
             <div className="bg-gray-100 rounded-xl p-4 mb-6 text-center">
               <p className="text-3xl font-bold text-gray-900">KES {dailyAmount.toLocaleString()}</p>
               <p className="text-xs text-gray-600 mt-1">Daily contribution amount</p>
             </div>
             <div className="flex gap-3">
               <button onClick={() => setSelectedDate(null)} className="flex-1 py-3 px-6 bg-gray-100 rounded-full font-semibold text-gray-900 hover:bg-gray-200 transition">Cancel</button>
               <button onClick={() => handleAddContributionForDate(selectedDate)} className="flex-1 py-3 px-6 bg-blue-600 rounded-full font-semibold text-white hover:bg-blue-700 transition">Confirm</button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }
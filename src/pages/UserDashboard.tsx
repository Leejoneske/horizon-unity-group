import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { hasSupabaseCredentials } from '@/integrations/supabase/client';
import { sendContributionSuccessSMS, sendMilestoneCongreatsSMS } from '@/lib/sms-reminders';
import { 
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  Wallet,
  AlertCircle,
  X,
  LogOut,
  Search,
  Share2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, differenceInDays, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import TipsCard from '@/components/TipsCard';
import NotificationCenter from '@/components/NotificationCenter';
import AccountDetailsPanel from '@/components/AccountDetailsPanel';

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

interface ActiveCycle {
  id: string;
  cycle_name: string;
  start_date: string;
  end_date: string;
  status: string;
}

export default function UserDashboard() {
  const { user, signOut, isAdmin, isLoading: authLoading, sessionExpired, clearSessionExpired } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showInviteCard, setShowInviteCard] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [activeCycle, setActiveCycle] = useState<ActiveCycle | null>(null);
  const [paymentPolling, setPaymentPolling] = useState(false);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const [pesapalIframeUrl, setPesapalIframeUrl] = useState<string | null>(null);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Redirect on session expiry
  useEffect(() => {
    if (sessionExpired) {
      clearSessionExpired();
      toast({ title: 'Session expired', description: 'Please log in again.', variant: 'destructive' });
      navigate('/login', { replace: true });
    }
  }, [sessionExpired]);

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

  // Periodic session validity check — detect stale sessions before they cause empty UI
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn('Session lost during interval check');
          toast({ title: 'Session expired', description: 'Please log in again.', variant: 'destructive' });
          navigate('/login', { replace: true });
        }
      } catch {
        // ignore network errors
      }
    }, 60000); // Check every 60 seconds
    return () => clearInterval(interval);
  }, [user, navigate, toast]);

  // No longer needed - payment stays in-app via iframe

  const startPaymentPolling = useCallback((reference: string) => {
    setPaymentPolling(true);
    toast({ title: '⏳ Checking payment...', description: 'Verifying your M-Pesa payment status.' });

    let attempts = 0;
    const maxAttempts = 30; // Poll for ~2.5 minutes
    
    const poll = setInterval(async () => {
      attempts++;
      try {
        const { data } = await supabase
          .from('payment_transactions')
          .select('status')
          .eq('merchant_reference', reference)
          .single();
        
        if (data?.status === 'confirmed') {
          clearInterval(poll);
          setPaymentPolling(false);
          setPendingReference(null);
          setPesapalIframeUrl(null);
          toast({ title: '✅ Payment Confirmed!', description: 'Your contribution has been recorded.' });
          fetchData();
        } else if (data?.status === 'failed' || data?.status === 'cancelled') {
          clearInterval(poll);
          setPaymentPolling(false);
          setPendingReference(null);
          setPesapalIframeUrl(null);
          toast({ title: '❌ Payment Failed', description: 'The payment was not completed. Please try again.', variant: 'destructive' });
        } else if (attempts >= maxAttempts) {
          clearInterval(poll);
          setPaymentPolling(false);
          setPendingReference(null);
          toast({ title: '⏱ Payment Pending', description: 'We\'re still waiting for confirmation. It may take a few minutes.' });
        }
      } catch {
        // Keep polling
      }
    }, 5000);

    return () => clearInterval(poll);
  }, [toast]);

  const fetchData = async () => {
    try {
      const [profileRes, messagesRes, cycleRes] = await Promise.all([
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
          .limit(5),
        supabase
          .from('savings_cycles')
          .select('*')
          .eq('status', 'active')
          .limit(1)
          .single()
      ]);

      // Check if profile fetch failed due to auth — means session is stale
      if (profileRes.error) {
        const code = (profileRes.error as any)?.code;
        const msg = profileRes.error.message?.toLowerCase() || '';
        if (code === 'PGRST301' || msg.includes('jwt') || msg.includes('unauthorized') || msg.includes('expired')) {
          console.warn('Session expired during data fetch');
          toast({ title: 'Session expired', description: 'Please log in again.', variant: 'destructive' });
          navigate('/login', { replace: true });
          return;
        }
      }

      const activeCycleData = cycleRes.data as ActiveCycle | null;
      if (activeCycleData) setActiveCycle(activeCycleData);
      else setActiveCycle(null);

      // Fetch contributions scoped to active cycle
      let contribQuery = supabase
        .from('contributions')
        .select('*')
        .eq('user_id', user!.id)
        .order('contribution_date', { ascending: false });

      if (activeCycleData) {
        contribQuery = contribQuery
          .gte('contribution_date', activeCycleData.start_date)
          .lte('contribution_date', activeCycleData.end_date);
      }

      const { data: contribData } = await contribQuery;
      if (contribData) setContributions(contribData);
      
      let profileData = profileRes.data;
      
      // If phone_number is missing from profile, extract from auth metadata
      if (profileData && !profileData.phone_number && user) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const phoneFromAuth = authUser?.user_metadata?.phone_number;

        if (phoneFromAuth && phoneFromAuth.trim()) {
          const { data: updated } = await supabase
            .from('profiles')
            .update({ phone_number: phoneFromAuth })
            .eq('user_id', user.id)
            .select('full_name, phone_number, balance_visible, daily_contribution_amount, balance_adjustment, missed_contributions')
            .single();

          if (updated) profileData = updated;
        }
      }
      
      if (profileData) setProfile(profileData);
      if (messagesRes.data) setMessages(messagesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMissedDays = () => {
    if (!activeCycle) return 0;
    const today = startOfDay(new Date());
    const cycleStart = startOfDay(parseISO(activeCycle.start_date));
    const cycleEnd = startOfDay(parseISO(activeCycle.end_date));
    const yesterday = startOfDay(new Date(today.getTime() - 24 * 60 * 60 * 1000));
    const endDay = yesterday < cycleStart ? cycleStart : (yesterday <= cycleEnd ? yesterday : cycleEnd);
    const totalDays = Math.max(0, differenceInDays(endDay, cycleStart) + 1);
    const contributedDays = contributions.filter(c => {
      const d = startOfDay(parseISO(c.contribution_date));
      return d >= cycleStart && d <= endDay;
    }).length;
    return Math.max(0, totalDays - contributedDays);
  };

  const handleAddContribution = async () => {
    if (!activeCycle) {
      toast({ title: 'No active cycle', description: 'Deposits are disabled until admin starts a new savings cycle.', variant: 'destructive' });
      return;
    }
    const today = format(new Date(), 'yyyy-MM-dd');
    const existingToday = contributions.find(c => c.contribution_date === today);
    if (existingToday) {
      toast({ title: 'Already contributed', description: 'You have already made a contribution today.', variant: 'destructive' });
      return;
    }
    setShowPaymentConfirm(true);
  };

  const handleInitiatePayment = async () => {
    if (!profile?.phone_number) {
      toast({ title: 'Error', description: 'Phone number not registered. Please update your profile.', variant: 'destructive' });
      setShowPaymentConfirm(false);
      return;
    }

    setPaymentLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) throw new Error('Backend not configured');

      const functionUrl = `${supabaseUrl}/functions/v1/initiate-pesapal-payment`;
      const dailyAmount = profile?.daily_contribution_amount || 100;

      // Build callback URL that returns user to dashboard with reference
      const callbackPageUrl = `${window.location.origin}/dashboard?payment=pending`;

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
        },
        body: JSON.stringify({
          userId: user!.id,
          amount: dailyAmount,
          phoneNumber: profile.phone_number,
          userName: profile.full_name || 'User',
          callbackPageUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Failed with status ${response.status}`);
      }

      setShowPaymentConfirm(false);

      if (result.reference) {
        setPendingReference(result.reference);
        startPaymentPolling(result.reference);
        
        if (result.redirectUrl) {
          // Show PesaPal payment page in iframe modal
          setPesapalIframeUrl(result.redirectUrl);
          toast({
            title: '📱 Complete Payment',
            description: 'Select M-Pesa in the payment window and enter your PIN when prompted.',
          });
        } else {
          toast({
            title: '✅ Payment Initiated',
            description: 'Check your phone for the M-Pesa prompt.',
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process payment';
      toast({ title: '❌ Payment Error', description: message, variant: 'destructive' });
    } finally {
      setPaymentLoading(false);
    }
  };

  // No longer needed - payment stays in-app via iframe

  const handleAddContributionForDate = async (date: Date) => {
    if (!activeCycle) {
      toast({ title: 'No active cycle', description: 'Deposits are disabled until admin starts a new savings cycle.', variant: 'destructive' });
      return;
    }
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

      // Send confirmation SMS + check for milestones
      try {
        if (profile?.phone_number) {
          await sendContributionSuccessSMS(profile.phone_number, dailyAmount, profile.full_name);
          
          // Check for milestone (contribution count after this one)
          const newCount = (contributions?.length || 0) + 1;
          if ([7, 14, 30, 50, 100].includes(newCount)) {
            await sendMilestoneCongreatsSMS(
              profile.phone_number,
              profile.full_name,
              `${newCount}-Day Milestone`,
              `You've made ${newCount} contributions! Amazing consistency!`
            );
          }
        }
      } catch (smsErr) {
        console.error('Contribution SMS failed:', smsErr);
      }

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
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      navigate('/login', { replace: true });
    }
  };

  const handleInvite = async () => {
    try {
      const appUrl = window.location.origin;
      const inviteLink = `${appUrl}/register?referral=${user?.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Join Horizon Unit',
          text: 'Save together with our smart group savings app. Join my savings circle!',
          url: inviteLink,
        });
        toast({ title: 'Shared!', description: 'Your referral link has been shared.' });
      } else {
        await navigator.clipboard.writeText(inviteLink);
        toast({ title: 'Link copied!', description: 'Your referral link has been copied to clipboard.' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to share invite link';
      if (message !== 'Share canceled') {
        toast({ title: 'Error', description: message, variant: 'destructive' });
      }
    }
  };

  // Cycle-scoped balance: only contributions in this cycle, NO balance_adjustment (old cycle adjustments)
  const totalContributions = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
  const effectiveBalance = totalContributions;
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

  if (authLoading || isLoading) {
    return (
      <div className="w-screen h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-white overflow-hidden flex flex-col">
      <div className="w-full h-full bg-white overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
              {profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleInvite}
              className="px-5 py-2.5 bg-gray-100 rounded-full text-sm font-medium text-gray-900 hover:bg-gray-200 transition flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Invite
            </button>
            {user && <NotificationCenter userId={user.id} />}
            <button 
              onClick={handleSignOut}
              className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Payment Polling Banner */}
          {paymentPolling && (
            <div className="px-4 pt-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <div>
                  <p className="font-semibold text-blue-900 text-sm">Verifying payment...</p>
                  <p className="text-xs text-blue-700">Waiting for M-Pesa confirmation</p>
                </div>
              </div>
            </div>
          )}

          {/* Balance Card */}
          <div className="px-4 pt-6 pb-4">
            <div className="bg-gray-100 rounded-3xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-1">{profile?.full_name?.split(' ')[0] || 'User'}</h2>
                  <p className="text-2xl text-gray-400 font-medium">
                    {profile?.balance_visible 
                      ? `KES ${effectiveBalance.toLocaleString()}` 
                      : 'KES ****'
                    }
                  </p>
                  {!profile?.balance_visible && (
                    <p className="text-xs text-gray-400 mt-1">Balance hidden by admin</p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              </div>
              {activeCycle ? (
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-500 font-medium">{activeCycle.cycle_name} · ends {format(parseISO(activeCycle.end_date), 'MMM d')}</span>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  <span className="text-xs text-red-500 font-medium">No active cycle — deposits paused</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 pb-6">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleAddContribution}
                className="bg-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-gray-200 transition active:scale-95"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Plus className="w-6 h-6 text-gray-900" />
                </div>
                <span className="text-base font-semibold text-gray-900">Add money</span>
              </button>
              
              <button 
                onClick={() => setShowAccountDetails(true)}
                className="bg-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-gray-200 transition active:scale-95"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Building2 className="w-6 h-6 text-gray-900" />
                </div>
                <span className="text-base font-semibold text-gray-900">Account details</span>
              </button>
            </div>
          </div>

          {/* Tips Card */}
          <TipsCard 
            showClose={true}
            onClose={() => setShowInviteCard(false)}
            showInitially={showInviteCard}
          />

          {/* Missed Days Alert */}
          {missedDays > 0 && (
            <div className="px-4 pb-6">
              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl p-6 relative overflow-hidden">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-300 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Catch up!</h3>
                    <p className="text-gray-700 font-medium">{missedDays} day{missedDays > 1 ? 's' : ''} pending contribution</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {unreadMessages.length > 0 && (
            <div className="px-4 pb-4">
              <h3 className="text-lg font-semibold text-gray-600 mb-4">Messages</h3>
              <div className="space-y-3">
                {unreadMessages.map(message => (
                  <div 
                    key={message.id}
                    onClick={() => handleMarkMessageRead(message.id)}
                    className="bg-gray-100 rounded-2xl p-4 cursor-pointer hover:bg-gray-200 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        message.message_type === 'warning' 
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                          : 'bg-gradient-to-br from-blue-400 to-blue-500'
                      }`}>
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{message.message}</p>
                        <p className="text-sm text-gray-500">{format(parseISO(message.created_at), 'MMM d, HH:mm')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendar */}
          <div className="px-4 pb-4">
            <h3 className="text-lg font-semibold text-gray-600 mb-4">{format(currentMonth, 'MMMM yyyy')}</h3>
            <div className="bg-gray-100 rounded-3xl p-4">
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-500 mb-3">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="py-2">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
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
                      disabled={true}
                      className={`aspect-square rounded-xl flex items-center justify-center text-sm font-semibold transition-all ${
                        contributed 
                          ? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-sm' 
                          : isToday 
                            ? 'bg-white text-gray-900 ring-2 ring-gray-900' 
                            : isFuture
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600'
                      }`}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-600">Recent</h3>
              <div className="flex items-center gap-2">
                {profile?.balance_visible && contributions.length > 0 && (
                  <button
                    onClick={() => {
                      let csv = 'Date,Amount (KES),Status\n';
                      contributions.forEach(c => {
                        csv += `${c.contribution_date},${c.amount},${c.status}\n`;
                      });
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `contributions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast({ title: 'Downloaded', description: 'Your contribution history has been saved.' });
                    }}
                    className="text-xs font-medium text-gray-500 flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    CSV
                  </button>
                )}
                {profile?.balance_visible && contributions.length > 3 && (
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-sm font-medium text-gray-900"
                  >
                    {showHistory ? 'Show less' : 'View all'}
                  </button>
                )}
              </div>
            </div>
            
            {contributions.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Your activity feed</h3>
                <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                  When you add money it shows up here. Get started by adding your first contribution.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {contributions.slice(0, showHistory && profile?.balance_visible ? contributions.length : 3).map((contribution) => (
                  <div key={contribution.id} className="bg-gray-100 rounded-2xl p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        contribution.status === 'completed' 
                          ? 'bg-gradient-to-br from-green-400 to-green-500' 
                          : 'bg-gradient-to-br from-amber-400 to-orange-500'
                      }`}>
                        {contribution.status === 'completed' 
                          ? <CheckCircle2 className="w-5 h-5 text-white" /> 
                          : <Clock className="w-5 h-5 text-white" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {profile?.balance_visible 
                            ? `+KES ${Number(contribution.amount).toLocaleString()}`
                            : 'Contribution recorded'
                          }
                        </p>
                        <p className="text-sm text-gray-500">{format(parseISO(contribution.contribution_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Nav */}
          <div className="bg-white border-t border-gray-200">
            <div className="px-4 py-3">
              <p className="text-center text-sm text-gray-600 mb-3">
                Daily target: <span className="font-semibold">KES {dailyAmount.toLocaleString()}</span>
              </p>
              <div className="grid grid-cols-2 gap-3 pb-2">
                <button 
                  onClick={() => {
                    if (profile?.balance_visible) {
                      setShowHistory(!showHistory);
                    } else {
                      toast({ title: 'History hidden', description: 'Full history is available when balance is visible.', variant: 'default' });
                    }
                  }}
                  className={`py-4 px-6 rounded-full text-base font-semibold transition active:scale-95 ${
                    profile?.balance_visible 
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' 
                      : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  History
                </button>
                <button 
                  onClick={handleAddContribution}
                  className="py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full text-base font-semibold text-white hover:from-orange-600 hover:to-orange-700 transition shadow-lg shadow-orange-500/30 active:scale-95"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PesaPal Payment Iframe Modal */}
      {pesapalIframeUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col items-center justify-center p-2">
          <div className="bg-white rounded-3xl w-full max-w-md h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-lg text-gray-900">Complete Payment</h3>
                <p className="text-xs text-gray-500">Select M-Pesa and enter your PIN</p>
              </div>
              <button
                onClick={() => {
                  setPesapalIframeUrl(null);
                }}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 relative">
              {paymentPolling && (
                <div className="absolute top-0 left-0 right-0 bg-blue-50 px-4 py-2 flex items-center gap-2 z-10">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-blue-700 font-medium">Waiting for confirmation...</p>
                </div>
              )}
              <iframe
                src={pesapalIframeUrl}
                className="w-full h-full border-0"
                title="PesaPal Payment"
                allow="payment"
              />
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Dialog */}
      {showPaymentConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl text-gray-900">Confirm Payment</h3>
              <p className="text-gray-500 text-sm mt-1">via M-Pesa</p>
            </div>

            <div className="bg-gray-100 rounded-2xl p-4 mb-4">
              <p className="text-xs text-gray-600 font-semibold mb-1">M-PESA NUMBER</p>
              <p className="text-2xl font-bold text-gray-900">{profile?.phone_number ? profile.phone_number.replace(/^254/, '0') : 'Not set'}</p>
              <p className="text-xs text-gray-500 mt-1">Payment will open in-app</p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 mb-6">
              <p className="text-xs text-green-700 font-semibold mb-1">AMOUNT</p>
              <p className="text-3xl font-bold text-green-600">KES {(profile?.daily_contribution_amount || 100).toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">Your daily contribution</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowPaymentConfirm(false)}
                disabled={paymentLoading}
                className="py-4 px-6 bg-gray-100 rounded-full font-semibold text-gray-900 hover:bg-gray-200 transition active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleInitiatePayment}
                disabled={paymentLoading}
                className="py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-semibold text-white hover:from-green-600 hover:to-emerald-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {paymentLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Pay Now'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Details Panel */}
      {showAccountDetails && profile && user && (
        <AccountDetailsPanel
          profile={profile}
          user={user}
          effectiveBalance={effectiveBalance}
          contributions={contributions}
          missedDays={missedDays}
          dailyAmount={dailyAmount}
          activeCycle={activeCycle}
          onClose={() => setShowAccountDetails(false)}
          onProfileUpdated={fetchData}
        />
      )}
    </div>
  );
}

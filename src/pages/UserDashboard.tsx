import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
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
  const [showInviteCard, setShowInviteCard] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
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
      
      let profileData = profileRes.data;
      
      // If phone_number is missing from profile, extract from auth metadata and update
      if (profileData && !profileData.phone_number && user) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const phoneFromAuth = authUser?.user_metadata?.phone_number 
          || authUser?.raw_user_meta_data?.phone_number;

        if (phoneFromAuth && phoneFromAuth.trim()) {
          // Update profile with phone number from auth
          const { data: updated } = await supabase
            .from('profiles')
            .update({ phone_number: phoneFromAuth })
            .eq('user_id', user.id)
            .select('full_name, phone_number, balance_visible, daily_contribution_amount, balance_adjustment, missed_contributions')
            .single();

          if (updated) {
            profileData = updated;
          }
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

      // Show payment confirmation
      setShowPaymentConfirm(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process request';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleInitiatePayment = async () => {
    if (!profile?.phone_number) {
      toast({ 
        title: 'Error', 
        description: 'Phone number not registered. Please update your profile.', 
        variant: 'destructive' 
      });
      setShowPaymentConfirm(false);
      return;
    }

    setPaymentLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Backend not configured');
      }

      const functionUrl = `${supabaseUrl}/functions/v1/initiate-pesapal-payment`;
      const dailyAmount = profile?.daily_contribution_amount || 100;

      console.log('Calling Edge Function:', functionUrl);

      // Call the backend function
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user!.id,
          amount: dailyAmount,
          phoneNumber: profile.phone_number,
          userName: profile.full_name || 'User',
        }),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response result:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Failed with status ${response.status}`);
      }

      // Payment initiated - show waiting message
      setShowPaymentConfirm(false);
      
      toast({
        title: '✅ Payment Initiated',
        description: `Check your phone for M-Pesa prompt. Enter your PIN to complete the payment.`,
      });

      // Wait a bit then close and refresh
      setTimeout(() => {
        fetchData();
      }, 2000);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process payment';
      toast({ 
        title: '❌ Payment Error', 
        description: message, 
        variant: 'destructive' 
      });
    } finally {
      setPaymentLoading(false);
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
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      // Force navigate even if signOut fails
      navigate('/login', { replace: true });
    }
  };

  const handleInvite = async () => {
    try {
      // Get the app URL
      const appUrl = window.location.origin;
      const inviteLink = `${appUrl}/register?referral=${user?.id}`;
      
      // Try to use native share if available
      if (navigator.share) {
        await navigator.share({
          title: 'Join Horizon Unit',
          text: 'Save together with our smart group savings app. Join my savings circle!',
          url: inviteLink,
        });
        toast({ title: 'Shared!', description: 'Your referral link has been shared.' });
      } else {
        // Fallback: Copy to clipboard
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
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
              {profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            {unreadMessages.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-400 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleInvite}
              className="px-5 py-2.5 bg-gray-100 rounded-full text-sm font-medium text-gray-900 hover:bg-gray-200 transition flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Invite
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
            </div>
          </div>

          {/* Action Buttons Grid */}
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
              
              <button className="bg-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-gray-200 transition active:scale-95">
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

          {/* Messages Section */}
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

          {/* Calendar Section */}
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

          {/* Recent Activity - Show only 3 items, full history requires balance visibility */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-600">Recent</h3>
              {profile?.balance_visible && contributions.length > 3 && (
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-sm font-medium text-blue-600"
                >
                  {showHistory ? 'Show less' : 'View all'}
                </button>
              )}
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

        {/* Bottom Navigation - Inside scrollable container */}
        <div className="bg-white border-t border-gray-200">
          <div className="px-4 py-3">
            <p className="text-center text-sm text-gray-600 mb-3">
              Daily target: <span className="font-semibold">KES {dailyAmount.toLocaleString()}</span>. 
              Tap the button below to contribute.
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

            {/* Phone Number */}
            <div className="bg-gray-100 rounded-2xl p-4 mb-4">
              <p className="text-xs text-gray-600 font-semibold mb-1">TO (M-Pesa Number)</p>
              <p className="text-2xl font-bold text-gray-900">{profile?.phone_number ? profile.phone_number.replace(/^254/, '0') : 'Loading...'}</p>
              <p className="text-xs text-gray-500 mt-1">You will receive STK prompt on this number</p>
            </div>

            {/* Amount */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 mb-6">
              <p className="text-xs text-green-700 font-semibold mb-1">AMOUNT</p>
              <p className="text-3xl font-bold text-green-600">KES {(profile?.daily_contribution_amount || 100).toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">You'll enter your PIN on your phone</p>
            </div>

            {/* Buttons */}
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
    </div>
  );
}

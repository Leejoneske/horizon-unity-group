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
  MessageSquare,
  Bell,
  AlertCircle,
  Info,
  Eye,
  Settings
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, differenceInDays, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { sendMissedDayReminder, sendContributionSuccessSMS } from '@/lib/sms-reminders';
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
  sms_enabled?: boolean;
  last_missed_reminder_sent?: string;
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
          .select('full_name, phone_number, balance_visible, daily_contribution_amount, balance_adjustment, missed_contributions, sms_enabled, last_missed_reminder_sent')
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
      if (profileRes.data) {
        setProfile(profileRes.data);
        
        // Send missed day reminder SMS if applicable
        if (profileRes.data.sms_enabled && profileRes.data.phone_number) {
          // Calculate missed days for this profile
          const contributions = contribRes.data || [];
          const today = startOfDay(new Date());
          const yesterday = startOfDay(new Date(today.getTime() - 24 * 60 * 60 * 1000));
          
          const sortedByDate = [...contributions].sort((a, b) => 
            new Date(b.contribution_date).getTime() - new Date(a.contribution_date).getTime()
          );
          
          const lastContribDate = sortedByDate.length > 0 
            ? startOfDay(parseISO(sortedByDate[0].contribution_date))
            : null;
          
          let missedDays = 0;
          if (lastContribDate && lastContribDate < yesterday) {
            missedDays = differenceInDays(yesterday, lastContribDate);
          }
          
          // Send reminder if there are missed days and we haven't already sent one today
          if (missedDays > 0) {
            const lastReminderDate = profileRes.data.last_missed_reminder_sent 
              ? startOfDay(parseISO(profileRes.data.last_missed_reminder_sent))
              : null;
            
            if (!lastReminderDate || lastReminderDate < today) {
              await sendMissedDayReminder(
                profileRes.data.phone_number,
                missedDays,
                profileRes.data.full_name
              ).catch(err => console.error('SMS reminder sending failed:', err));
            }
          }
        }
      }
      if (messagesRes.data) setMessages(messagesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMissedDays = () => {
    if (contributions.length === 0) return 0;
    
    // Count missed days only from yesterday onwards, not including today
    const today = startOfDay(new Date());
    const yesterday = startOfDay(new Date(today.getTime() - 24 * 60 * 60 * 1000));
    const contributionDates = contributions.map(c => startOfDay(parseISO(c.contribution_date)));
    const earliestContrib = contributionDates[contributionDates.length - 1];
    
    // Only count missed days up to yesterday
    const totalDays = Math.max(0, differenceInDays(yesterday, earliestContrib) + 1);
    const contributedDays = contributions.length;
    
    return Math.max(0, totalDays - contributedDays);
  };

  const handleAddContribution = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Check if already contributed today
      const existingToday = contributions.find(
        c => c.contribution_date === today
      );
      
      if (existingToday) {
        toast({
          title: 'Already contributed',
          description: 'You have already made a contribution today.',
          variant: 'destructive',
        });
        return;
      }

      const dailyAmount = profile?.daily_contribution_amount || 100;
      const contributionAmount = dailyAmount;

      const { error } = await supabase
        .from('contributions')
        .insert({
          user_id: user!.id,
          amount: contributionAmount,
          contribution_date: today,
          status: 'completed',
          notes: null
        });

      if (error) throw error;

      toast({
        title: 'Contribution added!',
        description: `KES ${contributionAmount.toLocaleString()} has been recorded for today.`,
      });
      
      // Send SMS confirmation if enabled
      if (profile?.sms_enabled && profile?.phone_number) {
        await sendContributionSuccessSMS(
          profile.phone_number,
          contributionAmount,
          profile.full_name
        ).catch(err => console.error('SMS sending failed:', err));
      }
      
      fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add contribution';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleAddContributionForDate = async (date: Date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Check if already contributed on this date
      const existingContrib = contributions.find(
        c => c.contribution_date === dateStr
      );
      
      if (existingContrib) {
        toast({
          title: 'Already contributed',
          description: `You have already made a contribution for ${format(date, 'MMM d, yyyy')}.`,
          variant: 'destructive',
        });
        return;
      }

      // Don't allow contributions for future dates
      if (dateStr > today) {
        toast({
          title: 'Invalid date',
          description: 'You cannot contribute for future dates.',
          variant: 'destructive',
        });
        return;
      }

      const dailyAmount = profile?.daily_contribution_amount || 100;

      const { error } = await supabase
        .from('contributions')
        .insert({
          user_id: user!.id,
          amount: dailyAmount,
          contribution_date: dateStr,
          status: 'completed',
          notes: null
        });

      if (error) throw error;

      toast({
        title: 'Contribution added!',
        description: `KES ${dailyAmount.toLocaleString()} recorded for ${format(date, 'MMM d, yyyy')}.`,
      });
      
      // Send SMS confirmation if enabled
      if (profile?.sms_enabled && profile?.phone_number) {
        await sendContributionSuccessSMS(
          profile.phone_number,
          dailyAmount,
          profile.full_name
        ).catch(err => console.error('SMS sending failed:', err));
      }
      
      setSelectedDate(null);
      fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add contribution';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleMarkMessageRead = async (messageId: string) => {
    try {
      await supabase
        .from('admin_messages')
        .update({ is_read: true })
        .eq('id', messageId);
      
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
  const thisMonthTotal = thisMonthContributions.reduce((sum, c) => sum + Number(c.amount), 0);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const hasContributedOnDay = (day: Date) => {
    return contributions.some(c => isSameDay(parseISO(c.contribution_date), day));
  };

  const missedDays = calculateMissedDays();
  const dailyAmount = profile?.daily_contribution_amount || 100;

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'announcement':
        return <Bell className="w-4 h-4 text-primary" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const unreadMessages = messages.filter(m => !m.is_read);

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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold text-sm">
                {profile?.full_name?.charAt(0) || 'M'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground">{profile?.full_name || 'Member'}</p>
              <p className="text-xs text-muted-foreground">Member</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Admin Messages Banner */}
        {unreadMessages.length > 0 && (
          <div className="space-y-2">
            {unreadMessages.map(message => (
              <div 
                key={message.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  message.message_type === 'warning' 
                    ? 'border-warning/50 bg-warning/10' 
                    : 'border-primary/30 bg-primary/5'
                }`}
                onClick={() => handleMarkMessageRead(message.id)}
              >
                {getMessageIcon(message.message_type)}
                <div className="flex-1">
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(parseISO(message.created_at), 'MMM d, HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Balance Card */}
        <div className="finance-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Horizon Unit" className="w-6 h-6 object-contain" />
              <span className="font-medium text-foreground">Horizon Unit</span>
            </div>
          </div>
          <p className="stat-label mb-1">Your Total Savings</p>
          {profile?.balance_visible ? (
            <p className="balance-display">KES {effectiveBalance.toLocaleString()}</p>
          ) : (
            <div className="flex items-center gap-2">
              <EyeOff className="w-6 h-6 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">Balance hidden</p>
            </div>
          )}
          {!profile?.balance_visible && (
            <p className="text-xs text-muted-foreground mt-2">
              Your balance will be revealed by admin at the end of the savings cycle
            </p>
          )}
        </div>

        {/* Missed Days Alert */}
        {missedDays > 0 && (
          <div className="finance-card border-info/50 bg-info/10">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-info" />
              <div>
                <p className="font-medium">Missed Days</p>
                <p className="text-sm text-muted-foreground">
                  You have {missedDays} day{missedDays > 1 ? 's' : ''} to catch up on. Click any date on the calendar above to add a contribution!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleAddContribution}
            className="finance-card flex flex-col items-center gap-2 hover:border-primary/50"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm font-medium">Add Today</span>
            <span className="text-xs text-muted-foreground">
              KES {dailyAmount.toLocaleString()}
            </span>
          </button>
          <div className="finance-card flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <Wallet className="w-6 h-6 text-accent-foreground" />
            </div>
            <span className="text-sm font-medium">Daily Target</span>
            <span className="text-xs text-muted-foreground">
              KES {dailyAmount.toLocaleString()}/day
            </span>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="finance-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-medium">This Month</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="stat-label">Contributions</p>
              <p className="text-2xl font-bold">{thisMonthContributions.length}</p>
            </div>
            <div>
              <p className="stat-label">Total Saved</p>
              {profile?.balance_visible ? (
                <button
                  onClick={() => setShowMonthlyAmount(!showMonthlyAmount)}
                  className="flex items-center gap-2 text-2xl font-bold amount-positive hover:opacity-75 transition-opacity"
                >
                  {showMonthlyAmount ? (
                    <>
                      <Eye className="w-5 h-5" />
                      KES {thisMonthTotal.toLocaleString()}
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-5 h-5" />
                      <span className="text-lg text-muted-foreground">Hidden</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <EyeOff className="w-5 h-5" />
                  <span className="text-lg">Hidden by Admin</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="finance-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-muted-foreground font-medium py-1">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for alignment */}
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
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-all ${
                    contributed 
                      ? 'bg-primary text-primary-foreground cursor-default' 
                      : isToday 
                        ? 'bg-accent text-accent-foreground border-2 border-primary hover:opacity-80 cursor-pointer' 
                        : isFuture
                          ? 'bg-muted/30 text-muted-foreground cursor-not-allowed'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer'
                  }`}
                  title={contributed ? 'Already contributed' : isFuture ? 'Cannot contribute to future dates' : 'Click to contribute'}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            💡 Click any day to contribute for that date
          </p>
        </div>

        {/* Contribution Date Dialog */}
        {selectedDate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-background rounded-lg p-6 max-w-sm mx-4">
              <h3 className="font-semibold mb-4">Contribute for {format(selectedDate, 'MMMM d, yyyy')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add a KES {profile?.daily_contribution_amount || 100} contribution for this date?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDate(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAddContributionForDate(selectedDate)}
                  className="flex-1"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity - Only 3 items */}
        <div className="finance-card">
          <h3 className="font-medium mb-4">Recent Activity</h3>
          {contributions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No contributions yet. Start saving today!
            </p>
          ) : (
            <div className="space-y-3">
              {contributions.slice(0, 3).map((contribution) => (
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
                        {contribution.notes || 'Daily Contribution'}
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

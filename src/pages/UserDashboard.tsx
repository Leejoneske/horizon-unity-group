import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { sendSuccessfulContributionSMS } from '@/lib/sms';
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
  sms_enabled?: boolean;
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
  const [showMonthlyAmount, setShowMonthlyAmount] = useState(false);
  const [isSMSSettingUpdating, setIsSMSSettingUpdating] = useState(false);
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
          .select('full_name, phone_number, balance_visible, daily_contribution_amount, balance_adjustment, missed_contributions, sms_enabled')
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
    const contributionDates = contributions.map(c => startOfDay(parseISO(c.contribution_date)));
    const earliestContrib = contributionDates[contributionDates.length - 1];
    
    const totalDays = differenceInDays(today, earliestContrib);
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

      const missedDays = calculateMissedDays();
      const dailyAmount = profile?.daily_contribution_amount || 100;
      // If there are missed days, double the contribution to catch up
      const contributionAmount = missedDays > 0 ? dailyAmount * 2 : dailyAmount;

      const { error } = await supabase
        .from('contributions')
        .insert({
          user_id: user!.id,
          amount: contributionAmount,
          contribution_date: today,
          status: 'completed',
          notes: missedDays > 0 ? `Catch-up contribution covering missed days` : null
        });

      if (error) throw error;

      // Send SMS notification (if enabled and phone exists)
      if (profile?.phone_number && profile?.sms_enabled !== false) {
        const newBalance = (contributions.reduce((sum, c) => sum + Number(c.amount), 0) + contributionAmount) + (profile?.balance_adjustment || 0);
        try {
          await sendSuccessfulContributionSMS(
            user!.id,
            profile.phone_number,
            contributionAmount,
            newBalance
          );
        } catch (smsError) {
          console.error('Failed to send SMS notification:', smsError);
          // SMS error shouldn't block the contribution success
        }
      }

      toast({
        title: 'Contribution added!',
        description: missedDays > 0 
          ? `KES ${contributionAmount.toLocaleString()} recorded (includes catch-up for missed days).`
          : `KES ${contributionAmount.toLocaleString()} has been recorded for today.`,
      });
      
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

  const handleToggleSMSNotifications = async () => {
    try {
      setIsSMSSettingUpdating(true);
      const newSmsEnabled = !profile?.sms_enabled;
      
      const { error } = await supabase
        .from('profiles')
        .update({ sms_enabled: newSmsEnabled })
        .eq('user_id', user!.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, sms_enabled: newSmsEnabled } : null);
      
      toast({
        title: newSmsEnabled ? 'SMS enabled' : 'SMS disabled',
        description: newSmsEnabled 
          ? 'You will receive SMS notifications for contributions.' 
          : 'You will no longer receive SMS notifications.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update SMS settings';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSMSSettingUpdating(false);
    }
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
  const nextContributionAmount = missedDays > 0 ? dailyAmount * 2 : dailyAmount;

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
          <div className="finance-card border-warning/50 bg-warning/10">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning" />
              <div>
                <p className="font-medium">Catch-up Required</p>
                <p className="text-sm text-muted-foreground">
                  You've missed {missedDays} day{missedDays > 1 ? 's' : ''}. Your next contribution will be KES {nextContributionAmount.toLocaleString()} to catch up.
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
              KES {nextContributionAmount.toLocaleString()}
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
              return (
                <div
                  key={day.toISOString()}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm ${
                    contributed 
                      ? 'bg-primary text-primary-foreground' 
                      : isToday 
                        ? 'bg-accent text-accent-foreground border-2 border-primary' 
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>
        </div>

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
                  {profile?.balance_visible ? (
                    <span className="font-semibold amount-positive">
                      +KES {Number(contribution.amount).toLocaleString()}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <EyeOff className="w-4 h-4" />
                      <span className="text-sm">Hidden</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings Section */}
        <div className="finance-card">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-primary" />
            <span className="font-medium">Settings</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">SMS Notifications</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive SMS updates about your contributions
                </p>
              </div>
              <Button
                size="sm"
                variant={profile?.sms_enabled ? 'default' : 'outline'}
                onClick={handleToggleSMSNotifications}
                disabled={isSMSSettingUpdating}
              >
                {profile?.sms_enabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            
            {profile?.phone_number && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  SMS will be sent to: {profile.phone_number}
                </p>
              </div>
            )}
          </div>
        </div>

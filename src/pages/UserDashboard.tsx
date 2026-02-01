import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  LogOut, 
  Plus,
  CheckCircle2,
  Clock,
  Wallet,
  Menu
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
}

export default function UserDashboard() {
  const { user, signOut, isAdmin, isLoading: authLoading } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
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
      const [contribRes, profileRes] = await Promise.all([
        supabase
          .from('contributions')
          .select('*')
          .eq('user_id', user!.id)
          .order('contribution_date', { ascending: false }),
        supabase
          .from('profiles')
          .select('full_name, phone_number')
          .eq('user_id', user!.id)
          .single()
      ]);

      if (contribRes.data) setContributions(contribRes.data);
      if (profileRes.data) setProfile(profileRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContribution = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
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

      const { error } = await supabase
        .from('contributions')
        .insert({
          user_id: user!.id,
          amount: 100,
          contribution_date: today,
          status: 'completed'
        });

      if (error) throw error;

      toast({
        title: 'Contribution added!',
        description: 'KES 100 has been recorded for today.',
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const totalContributions = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Wallet className="w-6 h-6 text-primary" />
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
              <span className="text-primary-foreground font-bold text-sm">
                {profile?.full_name?.charAt(0) || 'M'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground">{profile?.full_name || 'Member'}</p>
              <p className="text-xs text-muted-foreground">Horizon Unit</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Main Balance Card */}
        <div className="finance-card bg-gradient-to-br from-card to-card/50">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground">Your Total Savings</span>
          </div>
          <p className="balance-display mb-2">KES {totalContributions.toLocaleString()}</p>
          <p className="text-muted-foreground text-sm">Across all contributions</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Contribution Card */}
          <button 
            onClick={handleAddContribution}
            className="action-card md:col-span-2 p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 hover:border-primary/40"
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground">Add Today's Contribution</p>
            <p className="text-sm text-muted-foreground mt-2">Record KES 100 for today</p>
          </button>

          {/* This Month Stats */}
          <div className="finance-card">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-accent" />
              <span className="font-medium text-foreground">This Month</span>
            </div>
            <div className="space-y-4">
              <div>
                <p className="stat-label mb-1">Contributions</p>
                <p className="stat-value">{thisMonthContributions.length}</p>
              </div>
              <div>
                <p className="stat-label mb-1">Total Saved</p>
                <p className="stat-value amount-positive">KES {thisMonthTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Contribution Rate */}
          <div className="finance-card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              <span className="font-medium text-foreground">Consistency</span>
            </div>
            <div className="space-y-4">
              <div>
                <p className="stat-label mb-1">Daily Rate</p>
                <p className="stat-value">KES 100</p>
              </div>
              <div>
                <p className="stat-label mb-1">Days Active</p>
                <p className="stat-value text-accent">{contributions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="finance-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <span className="font-semibold text-lg">{format(currentMonth, 'MMMM yyyy')}</span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="rounded-full"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                Prev
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="rounded-full"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="rounded-full"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <div key={i} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {daysInMonth.map((day) => {
              const contributed = hasContributedOnDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`aspect-square rounded-2xl flex items-center justify-center font-semibold text-sm transition-all duration-200 ${
                    contributed 
                      ? 'bg-primary text-primary-foreground shadow-soft' 
                      : isToday 
                        ? 'bg-accent/20 text-accent border-2 border-accent' 
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="finance-card">
          <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Recent Activity
          </h3>
          {contributions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No contributions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start saving today by adding your first contribution!</p>
            </div>
          ) : (
            <div className="space-y-3 divide-y divide-border/50">
              {contributions.slice(0, 15).map((contribution) => (
                <div key={contribution.id} className="flex items-center justify-between py-4 first:pt-0">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      contribution.status === 'completed' ? 'bg-accent/15' : 'bg-warning/15'
                    }`}>
                      {contribution.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-accent" />
                      ) : (
                        <Clock className="w-6 h-6 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Daily Contribution</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(contribution.contribution_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-lg amount-positive">
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

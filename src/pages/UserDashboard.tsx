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
  Wallet
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
    // Fetch data from database
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
        {/* Balance Card */}
        <div className="finance-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Horizon Unit</span>
            </div>
          </div>
          <p className="stat-label mb-1">Your Total Savings</p>
          <p className="balance-display">KES {totalContributions.toLocaleString()}</p>
        </div>

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
          </button>
          <div className="finance-card flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <Wallet className="w-6 h-6 text-accent-foreground" />
            </div>
            <span className="text-sm font-medium">KES 100/day</span>
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
              <p className="text-2xl font-bold amount-positive">KES {thisMonthTotal.toLocaleString()}</p>
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

        {/* Recent Activity */}
        <div className="finance-card">
          <h3 className="font-medium mb-4">Recent Activity</h3>
          {contributions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No contributions yet. Start saving today!
            </p>
          ) : (
            <div className="space-y-3">
              {contributions.slice(0, 10).map((contribution) => (
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
                      <p className="text-sm font-medium">Daily Contribution</p>
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

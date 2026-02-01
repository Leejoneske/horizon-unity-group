import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Shield, ArrowRight, Wallet, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function Index() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="app-header">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Horizon Unit</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="rounded-full">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button className="rounded-full bg-primary hover:bg-primary/90">Join Now</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6">
        {/* Hero */}
        <div className="py-16 md:py-24 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 mb-8">
            <Users className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-foreground">
            Save Together,<br />Grow Together
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Track your group savings with ease. Simple, secure, and transparent savings management for your community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-lg h-auto py-4">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="rounded-full px-8 text-lg h-auto py-4 border-2">
                Member Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 py-16">
          <div className="finance-card text-center">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-3">Track Progress</h3>
            <p className="text-muted-foreground leading-relaxed">
              Monitor your daily contributions and watch your savings grow over time with an intuitive calendar view.
            </p>
          </div>

          <div className="finance-card text-center">
            <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-3">Group Transparency</h3>
            <p className="text-muted-foreground leading-relaxed">
              Everyone sees their contributions. Admins manage the group effortlessly with real-time insights.
            </p>
          </div>

          <div className="finance-card text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-3">Secure & Simple</h3>
            <p className="text-muted-foreground leading-relaxed">
              Your data is protected. Login with your credentials and manage your savings with confidence.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="finance-card my-16">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Register with your account</h4>
                <p className="text-muted-foreground leading-relaxed">Create your account using your phone number or email and set up a secure password.</p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Record your contributions</h4>
                <p className="text-muted-foreground leading-relaxed">Log your daily savings with one click. Default is KES 100, but you can customize any amount.</p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Track your progress</h4>
                <p className="text-muted-foreground leading-relaxed">View your history, calendar, and total savings anytime. Get detailed insights into your group's performance.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="grid md:grid-cols-3 gap-6 pb-16">
          <div className="promo-card">
            <CheckCircle2 className="w-10 h-10 text-accent mx-auto mb-4" />
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2">100%</div>
              <p className="text-sm text-muted-foreground">Transparent & Secure</p>
            </div>
          </div>
          <div className="promo-card">
            <Users className="w-10 h-10 text-primary mx-auto mb-4" />
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2">Community</div>
              <p className="text-sm text-muted-foreground">Grow your savings together</p>
            </div>
          </div>
          <div className="promo-card">
            <TrendingUp className="w-10 h-10 text-primary mx-auto mb-4" />
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2">Real-time</div>
              <p className="text-sm text-muted-foreground">Track every contribution</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p className="font-medium">Horizon Unit Group</p>
          <p className="mt-1 text-xs">Building stronger communities through transparent savings</p>
        </div>
      </footer>
    </div>
  );
}

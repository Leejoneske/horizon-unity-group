import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function Index() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && user) {
      // Redirect admin users to admin dashboard
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        // Redirect regular users to user dashboard
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only show landing page to non-authenticated users
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-lg">Horizon Unit</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Join Now</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Save Together,<br />Grow Together
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
            Track your group savings with ease. Simple, secure, and transparent savings management for your group.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Member Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="finance-card text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Track Progress</h3>
            <p className="text-sm text-muted-foreground">
              Monitor your daily contributions and watch your savings grow over time.
            </p>
          </div>
          <div className="finance-card text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Group Transparency</h3>
            <p className="text-sm text-muted-foreground">
              Everyone sees their contributions. Admins manage the group effortlessly.
            </p>
          </div>
          <div className="finance-card text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Secure & Simple</h3>
            <p className="text-sm text-muted-foreground">
              Your data is protected. Login with your phone number, admins use email.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="finance-card">
          <h2 className="text-xl font-semibold mb-6 text-center">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
                1
              </div>
              <div>
                <h4 className="font-medium">Register with your phone</h4>
                <p className="text-sm text-muted-foreground">Create your account using your phone number and password.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
                2
              </div>
              <div>
                <h4 className="font-medium">Record daily contributions</h4>
                <p className="text-sm text-muted-foreground">Log your KES 100 daily savings with one click.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
                3
              </div>
              <div>
                <h4 className="font-medium">Track your progress</h4>
                <p className="text-sm text-muted-foreground">View your history, calendar, and total savings anytime.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Horizon Unit Group</p>
        </div>
      </footer>
    </div>
  );
}

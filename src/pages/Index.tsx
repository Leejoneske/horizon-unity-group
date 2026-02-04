import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Shield, 
  ArrowRight, 
  Users,
  Calendar,
  Lock,
  Zap,
  CheckCircle2,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import logo from '@/assets/logo.png';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-md bg-background/50">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <img src={logo} alt="Horizon Unit" className="w-6 h-6 object-contain" />
              </div>
              <span className="font-bold text-lg text-foreground">Horizon Unit</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Benefits</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="rounded-lg">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button className="rounded-lg">Join Now</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4">
        <section className="py-20 sm:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Smart Group Savings</span>
                </div>
                <h1 className="text-5xl sm:text-6xl font-bold text-foreground leading-tight">
                  Save Together,<br />
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Grow Together</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  Transparent, flexible, and easy-to-use savings management for community groups. Track contributions, monitor progress, and achieve financial goals together.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/register" className="flex-1 sm:flex-none">
                  <Button size="lg" className="w-full sm:w-auto rounded-lg group">
                    Get Started Free
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/login" className="flex-1 sm:flex-none">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-lg">
                    Member Login
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-6 border-t border-border">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-background flex items-center justify-center text-sm font-semibold text-primary">
                      {i}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-foreground">Trusted by groups</p>
                  <p className="text-sm text-muted-foreground">Join thousands saving together</p>
                </div>
              </div>
            </div>

            {/* Right Visual - Feature Highlight */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-primary/5 rounded-3xl blur-2xl"></div>
              <div className="relative bg-card border border-border rounded-3xl p-8 shadow-xl">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Daily Tracking</h3>
                      <p className="text-sm text-muted-foreground mt-1">Record contributions anytime</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Real-time Analytics</h3>
                      <p className="text-sm text-muted-foreground mt-1">Monitor progress instantly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Group Communication</h3>
                      <p className="text-sm text-muted-foreground mt-1">Stay connected with admins</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 border-t border-border">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage group savings efficiently and transparently
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: "Track Progress",
                desc: "Monitor your daily contributions and watch your savings grow over time with visual charts."
              },
              {
                icon: Users,
                title: "Group Transparency",
                desc: "Everyone sees their contributions. Admins manage the group with full visibility and control."
              },
              {
                icon: Shield,
                title: "Secure & Simple",
                desc: "Your data is protected. Members login with phone, admins with email for easy access."
              },
              {
                icon: Lock,
                title: "Privacy Control",
                desc: "Admins can choose to hide or show balances, respecting members' financial privacy."
              },
              {
                icon: Calendar,
                title: "Flexible Contributions",
                desc: "No penalties. Click any past date to contribute. Contribute at your own pace."
              },
              {
                icon: MessageSquare,
                title: "Admin Messaging",
                desc: "Stay connected with group messages and SMS notifications to members."
              }
            ].map((feature, idx) => (
              <div key={idx} className="group bg-card border border-border rounded-2xl p-8 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 border-t border-border">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple steps to get started with your group savings
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              {
                step: 1,
                title: "Create Your Account",
                desc: "Register with your phone number and set a password. Get instant access to your dashboard."
              },
              {
                step: 2,
                title: "Record Contributions",
                desc: "Click 'Add Today' to record your daily savings or click any past date on the calendar."
              },
              {
                step: 3,
                title: "Track Your Progress",
                desc: "View your history, monitor total savings, and see your contribution calendar anytime."
              },
              {
                step: 4,
                title: "Group Management",
                desc: "Admins can message members, view member stats, and manage the entire group from one place."
              }
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-colors">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-primary/60">
                    <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">Step {item.step}: {item.title}</h3>
                  <p className="text-muted-foreground mt-2">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section id="testimonials" className="py-20 border-t border-border">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose Horizon Unit?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Designed specifically for community savings groups
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "No Penalties",
                desc: "Contribute flexibly without penalties. Click any past date when you're ready to catch up."
              },
              {
                title: "Transparent",
                desc: "Complete visibility of all contributions. Members know exactly where their savings go."
              },
              {
                title: "User-Friendly",
                desc: "Simple interface designed for everyone. No complex features or confusing workflows."
              },
              {
                title: "Mobile Ready",
                desc: "Works perfectly on phone or computer. Access your account anytime, anywhere."
              },
              {
                title: "SMS Notifications",
                desc: "Get reminders for missed contributions and confirmations for successful saves."
              },
              {
                title: "Admin Tools",
                desc: "Powerful admin dashboard to manage members, send messages, and track group progress."
              }
            ].map((benefit, idx) => (
              <div key={idx} className="flex gap-4 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-8">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 border-t border-border">
          <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-bold text-foreground mb-4">Ready to Start Saving?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Join Horizon Unit today and transform how your group manages savings
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="rounded-lg group">
                  Create Your Account
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="rounded-lg">
                  Sign In Instead
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-12 mt-20 bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                  <img src={logo} alt="Horizon Unit" className="w-5 h-5" />
                </div>
                <span className="font-bold text-foreground">Horizon Unit</span>
              </div>
              <p className="text-sm text-muted-foreground">Smart group savings management platform</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a></li>
                <li><a href="#testimonials" className="hover:text-foreground transition-colors">Benefits</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">© 2026 Horizon Unit Group. All rights reserved.</p>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Facebook</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

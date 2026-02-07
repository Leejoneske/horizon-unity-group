import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import { 
  TrendingUp, 
  Shield, 
  ArrowRight, 
  Users,
  Calendar,
  Lock,
  CheckCircle2,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import logo from '@/assets/logo.png';

// Simple landing page for all visitors
function SimpleLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex flex-col">
      {/* Simple Header */}
      <header className="border-b border-border/50 backdrop-blur-md bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Horizon Unit" className="w-6 h-6" />
            <span className="font-bold text-foreground">Horizon Unit</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Join</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero - Minimal */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-20">
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold text-foreground leading-tight">
            Smart Group Savings <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Made Simple</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Track contributions, monitor progress, and manage finances together. No penalties, just smart saving.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link to="/register">
              <Button size="lg" className="rounded-lg group">
                Get Started <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="rounded-lg">Sign In</Button>
            </Link>
          </div>
        </div>

        {/* Quick Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {[
            { icon: TrendingUp, title: "Track Progress", desc: "Monitor contributions with visual charts" },
            { icon: Users, title: "Group Transparency", desc: "Everyone sees contributions and updates" },
            { icon: Shield, title: "Secure", desc: "Protected data with simple login" }
          ].map((f, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6">
              <f.icon className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 bg-background/50">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Horizon Unit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function Index() {
  const { user, isAdmin, isLoading } = useAuth();

  // Only show loading spinner during initial auth check (very brief)
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

  // If user is logged in, show quick navigation options but don't auto-redirect
  if (user) {
    const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-muted-foreground">You're already logged in.</p>
          <Link to={dashboardPath}>
            <Button size="lg" className="rounded-lg">
              Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Horizon Unit - Group Savings Management Made Simple"
        description="Smart, transparent, and flexible group savings platform. Track member contributions, monitor progress, and manage community finances with ease. No penalties, just smart saving together."
        keywords="group savings, savings circle, merry go round, contribution tracking, financial management, community savings, Kenya, transparent savings"
        ogTitle="Horizon Unit - Save Together, Grow Together"
        ogDescription="The easiest way for groups to track savings and manage finances together. Simple, secure, transparent. Join thousands saving together."
        canonical={typeof window !== 'undefined' ? window.location.origin : ''}
        schema={{
          "@context": "https://schema.org",
          "@type": "SaaSProduct",
          "name": "Horizon Unit",
          "description": "Smart group savings management platform for transparent financial tracking",
          "url": typeof window !== 'undefined' ? window.location.origin : '',
          "applicationCategory": "FinanceApplication",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "description": "Free member accounts for group savings"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "500"
          }
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex flex-col">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        </div>

        {/* Navigation Header */}
        <header className="relative z-10 border-b border-border/50 backdrop-blur-md bg-white">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src={logo} alt="Horizon Unit" className="w-6 h-6" />
                <span className="font-bold text-foreground">Horizon Unit</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6 text-sm">
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
              </nav>
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Join Now</Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4">
          {/* Hero Section */}
          <section className="py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <h1 className="text-5xl sm:text-6xl font-bold text-foreground leading-tight">
                    Save Together,<br />
                    <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Grow Together</span>
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Transparent, flexible, and easy-to-use savings management for community groups.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Link to="/register">
                    <Button size="lg" className="rounded-lg group">
                      Get Started Free
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="rounded-lg">Member Login</Button>
                  </Link>
                </div>
              </div>

              {/* Right Visual */}
              <div className="bg-card border border-border rounded-2xl p-8">
                <div className="space-y-4">
                  {[
                    { icon: Calendar, title: "Daily Tracking", desc: "Record contributions anytime" },
                    { icon: BarChart3, title: "Analytics", desc: "Monitor progress instantly" },
                    { icon: MessageSquare, title: "Communication", desc: "Stay connected with admins" }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-16 border-t border-border">
            <h2 className="text-3xl font-bold text-foreground mb-10 text-center">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: TrendingUp, title: "Track Progress", desc: "Monitor daily contributions with visual charts" },
                { icon: Users, title: "Group Transparency", desc: "Everyone sees contributions with full visibility" },
                { icon: Shield, title: "Secure & Simple", desc: "Protected data with easy phone-based login" },
                { icon: Lock, title: "Privacy Control", desc: "Admins control what members can see" },
                { icon: Calendar, title: "Flexible Contributions", desc: "No penalties, contribute at your own pace" },
                { icon: MessageSquare, title: "Admin Messaging", desc: "Stay connected with group messages" }
              ].map((f, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
                  <f.icon className="w-6 h-6 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="py-16 border-t border-border">
            <h2 className="text-3xl font-bold text-foreground mb-10 text-center">How It Works</h2>
            <div className="space-y-4 max-w-2xl mx-auto">
              {[
                { step: 1, title: "Create Account", desc: "Register with phone number" },
                { step: 2, title: "Record Contributions", desc: "Add daily savings or select any past date" },
                { step: 3, title: "Track Progress", desc: "Monitor history and contribution calendar" },
                { step: 4, title: "Group Management", desc: "Admins manage members and send messages" }
              ].map((item) => (
                <div key={item.step} className="flex gap-4 bg-card border border-border rounded-xl p-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 font-bold text-primary">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Benefits */}
          <section className="py-16 border-t border-border">
            <h2 className="text-3xl font-bold text-foreground mb-10 text-center">Why Choose Horizon Unit?</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[
                { title: "No Penalties", desc: "Contribute flexibly without consequences" },
                { title: "Transparent", desc: "Complete visibility of all contributions" },
                { title: "User-Friendly", desc: "Simple interface for everyone" },
                { title: "Mobile Ready", desc: "Works on phone or computer" },
                { title: "SMS Notifications", desc: "Get reminders and confirmations" },
                { title: "Admin Tools", desc: "Powerful dashboard for management" }
              ].map((b, i) => (
                <div key={i} className="flex gap-3 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16">
            <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-2xl p-10 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-3">Ready to Start Saving?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join Horizon Unit and transform how your group manages finances
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register">
                  <Button size="lg" className="rounded-lg group">
                    Create Account
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="rounded-lg">Sign In</Button>
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-border/50 py-10 mt-10 bg-background/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <img src={logo} alt="Horizon Unit" className="w-5 h-5" />
                  <span className="font-bold text-foreground">Horizon Unit</span>
                </div>
                <p className="text-sm text-muted-foreground">Smart group savings platform</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3 text-sm">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3 text-sm">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3 text-sm">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
              <p>© 2026 Horizon Unit Group. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

import { Link } from 'react-router-dom';
import hugIllustration from '@/assets/hug-illustration.png';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import { 
  TrendingUp, 
  Shield, 
  ArrowRight, 
  Users,
  Calendar,
  Lock,
  MessageSquare,
  Heart,
  Zap,
  Target,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import logo from '@/assets/logo.png';

function SimpleLandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-10 bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Horizon Unit" className="w-6 h-6" />
            <span className="font-bold text-foreground">Horizon Unit</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Join Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-6xl mx-auto w-full px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Smart Group Savings,<br />
              <span className="text-primary">Your Way</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Save together with your community. Track contributions in real-time, stay transparent, and build financial security without penalties or surprises.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/register">
                <Button size="lg" className="rounded-lg group">
                  Get Started Free <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="rounded-lg border-border text-foreground hover:bg-secondary">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">No credit card required · Start saving in minutes</p>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="bg-secondary py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-3">Why Choose Horizon Unit?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to save smarter as a group</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Real-Time Tracking", desc: "See every contribution and how much your group has saved instantly. No delays, no confusion." },
              { icon: Users, title: "Full Transparency", desc: "Every member can see contributions. Build trust with complete visibility into group finances." },
              { icon: Shield, title: "Secure & Simple", desc: "Your data is protected with industry-standard security. No penalties, just straightforward saving." },
              { icon: Calendar, title: "Flexible Schedules", desc: "Set daily, weekly, or monthly contribution goals that work for your group's lifestyle." },
              { icon: MessageSquare, title: "Team Communication", desc: "Admins can send updates and reminders. Members stay connected and informed." },
              { icon: Target, title: "Save with Purpose", desc: "Track progress toward your group's savings goals and celebrate milestones together." }
            ].map((feature, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 hover:shadow-lg transition-shadow border border-border">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-3">How It Works</h2>
            <p className="text-muted-foreground text-lg">Get started in 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: 1, title: "Create Your Account", desc: "Sign up in minutes with your phone number. No forms, no fuss, no credit card needed." },
              { num: 2, title: "Set Your Group", desc: "Invite friends or colleagues to join your savings circle. Start with any group size." },
              { num: 3, title: "Start Saving", desc: "Make daily or scheduled contributions and watch your group's savings grow together." }
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="trust" className="bg-accent py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="text-center md:text-left">
              <Heart className="w-10 h-10 text-primary mb-4 mx-auto md:mx-0" />
              <h2 className="text-3xl font-bold text-foreground mb-2">Everyone Deserves a <span className="text-primary">HUG</span></h2>
              <p className="text-lg font-semibold text-foreground/80 mb-4"><span className="text-primary font-bold">H</span>orizon <span className="text-primary font-bold">U</span>nit <span className="text-primary font-bold">G</span>roup</p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                At Horizon, we believe that saving is more than just numbers — it's about holding each other up. That's why we call our community a <strong>HUG</strong>. Because when people come together with trust, transparency, and a shared goal, great things happen.
              </p>
              <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                {[
                  { icon: CheckCircle, label: "No Hidden Fees" },
                  { icon: Lock, label: "Data Encrypted" },
                  { icon: Zap, label: "Instant Updates" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <item.icon className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <img src={hugIllustration} alt="Community group hug illustration" className="w-72 h-72 object-contain drop-shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">Ready to Save Together?</h2>
          <p className="text-xl text-muted-foreground mb-8">Join thousands of groups already saving smarter with Horizon Unit.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="rounded-lg">
                Start Saving Now <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="rounded-lg">
                Already a Member?
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 bg-card mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logo} alt="Horizon Unit" className="w-5 h-5" />
                <span className="font-bold text-foreground">Horizon Unit</span>
              </div>
              <p className="text-sm text-muted-foreground">Smart group savings, made simple.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-muted-foreground hover:text-foreground">Features</a></li>
                <li><a href="#how-it-works" className="text-muted-foreground hover:text-foreground">How It Works</a></li>
                <li><a href="#trust" className="text-muted-foreground hover:text-foreground">Why Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Account</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="text-muted-foreground hover:text-foreground">Sign In</Link></li>
                <li><Link to="/register" className="text-muted-foreground hover:text-foreground">Join Free</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link></li>
                <li><Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Horizon Unit. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Index() {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-lg bg-accent flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-muted-foreground">You're already signed in.</p>
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
        title="Horizon Unit - Smart Group Savings Made Simple"
        description="Save together with your community. Track contributions in real-time, stay transparent, and build financial security with Horizon Unit."
        keywords="group savings, savings circle, community savings, contribution tracking, financial management"
        ogTitle="Horizon Unit - Save Together, Grow Together"
        ogDescription="The easiest way for groups to track savings and manage finances together. Join thousands saving smarter."
        canonical={typeof window !== 'undefined' ? window.location.origin : ''}
      />
      <SimpleLandingPage />
    </>
  );
}

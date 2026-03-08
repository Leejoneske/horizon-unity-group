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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 z-10 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Horizon Unit" className="w-6 h-6" />
            <span className="font-bold text-gray-900">Horizon Unit</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">Join Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-6xl mx-auto w-full px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Smart Group Savings,<br />
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Your Way</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Save together with your community. Track contributions in real-time, stay transparent, and build financial security without penalties or surprises.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg group">
                  Get Started Free <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="rounded-lg border-gray-300 text-gray-900 hover:bg-gray-50">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500">No credit card required • Start saving in minutes</p>
          </div>

        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Why Choose Horizon Unit?</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Everything you need to save smarter as a group</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: "Real-Time Tracking",
                desc: "See every contribution and how much your group has saved instantly. No delays, no confusion."
              },
              {
                icon: Users,
                title: "Full Transparency",
                desc: "Every member can see contributions. Build trust with complete visibility into group finances."
              },
              {
                icon: Shield,
                title: "Secure & Simple",
                desc: "Your data is protected with industry-standard security. No penalties, just straightforward saving."
              },
              {
                icon: Calendar,
                title: "Flexible Schedules",
                desc: "Set daily, weekly, or monthly contribution goals that work for your group's lifestyle."
              },
              {
                icon: MessageSquare,
                title: "Team Communication",
                desc: "Admins can send updates and reminders. Members stay connected and informed."
              },
              {
                icon: Target,
                title: "Save with Purpose",
                desc: "Track progress toward your group's savings goals and celebrate milestones together."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-600 text-lg">Get started in 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: 1,
                title: "Create Your Account",
                desc: "Sign up in minutes with your phone number. No forms, no fuss, no credit card needed."
              },
              {
                num: 2,
                title: "Set Your Group",
                desc: "Invite friends or colleagues to join your savings circle. Start with any group size."
              },
              {
                num: 3,
                title: "Start Saving",
                desc: "Make daily or scheduled contributions and watch your group's savings grow together."
              }
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-blue-50 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Heart className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Community Groups Everywhere</h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Horizon Unit is built for the values your group shares: transparency, trust, and collective progress. No hidden fees, no surprise penalties, just honest saving together.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              { icon: CheckCircle, label: "No Hidden Fees" },
              { icon: Lock, label: "Data Encrypted" },
              { icon: Zap, label: "Instant Updates" }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-2">
                <item.icon className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Save Together?</h2>
          <p className="text-xl text-gray-600 mb-8">Join thousands of groups already saving smarter with Horizon Unit.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg">
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
      <footer className="border-t border-gray-200 py-8 px-4 bg-white mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logo} alt="Horizon Unit" className="w-5 h-5" />
                <span className="font-bold text-gray-900">Horizon Unit</span>
              </div>
              <p className="text-sm text-gray-600">Smart group savings, made simple.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-600 hover:text-gray-900">Features</a></li>
                <li><a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</a></li>
                <li><a href="#trust" className="text-gray-600 hover:text-gray-900">Why Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Account</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="text-gray-600 hover:text-gray-900">Sign In</Link></li>
                <li><Link to="/register" className="text-gray-600 hover:text-gray-900">Join Free</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#privacy" className="text-gray-600 hover:text-gray-900">Privacy</a></li>
                <li><a href="#terms" className="text-gray-600 hover:text-gray-900">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-sm text-gray-600">© {new Date().getFullYear()} Horizon Unit. All rights reserved.</p>
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600">You're already signed in.</p>
          <Link to={dashboardPath}>
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg">
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

import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Users, CreditCard, AlertTriangle, Scale, RefreshCw } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import logo from '@/assets/logo.png';
import { useEffect } from 'react';

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(220,20%,8%)] text-[hsl(220,10%,85%)]">
      <SEOHead
        title="Terms of Service - Horizon Unit"
        description="Read the terms and conditions for using the Horizon Unit group savings platform."
      />

      {/* Header */}
      <header className="border-b border-[hsl(220,15%,15%)] sticky top-0 z-10 bg-[hsl(220,20%,8%)]/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Horizon Unit" className="w-6 h-6" />
            <span className="font-bold text-white">Horizon Unit</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-[hsl(220,10%,55%)] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center border-b border-[hsl(220,15%,15%)]">
        <div className="max-w-4xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(152,55%,45%)]/10 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-[hsl(152,55%,50%)]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-[hsl(220,10%,55%)] text-lg">
            Last updated: March 8, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {[
          {
            icon: Users,
            title: 'Account & Membership',
            content: [
              'By creating an account on Horizon Unit, you agree to provide accurate and complete personal information, including your name, email address, and phone number.',
              'You are responsible for maintaining the confidentiality of your account credentials. Any activity under your account is your responsibility.',
              'Horizon Unit reserves the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.'
            ]
          },
          {
            icon: CreditCard,
            title: 'Contributions & Savings',
            content: [
              'All contributions made through Horizon Unit are voluntary. The platform facilitates tracking and management of group savings but does not act as a financial institution.',
              'Contribution amounts and schedules are determined by your group administrator. Members are expected to honour their agreed-upon contribution commitments.',
              'Withdrawal requests are subject to group rules and admin approval. Horizon Unit does not guarantee instant access to funds.'
            ]
          },
          {
            icon: Scale,
            title: 'User Conduct',
            content: [
              'Users agree to use the platform solely for legitimate group savings purposes. Any attempt to manipulate records, impersonate other users, or exploit the system is strictly prohibited.',
              'Group administrators are responsible for managing their groups fairly and transparently. Misuse of admin privileges may result in account action.',
              'Users shall not attempt to access other users\' accounts, data, or any restricted areas of the platform without authorisation.'
            ]
          },
          {
            icon: AlertTriangle,
            title: 'Limitation of Liability',
            content: [
              'Horizon Unit provides the platform "as is" without warranties of any kind, either express or implied.',
              'We are not liable for any disputes between group members regarding contributions, withdrawals, or group management decisions.',
              'Horizon Unit shall not be held responsible for any financial losses resulting from system downtime, technical errors, or unauthorised access to your account.'
            ]
          },
          {
            icon: RefreshCw,
            title: 'Changes to Terms',
            content: [
              'Horizon Unit reserves the right to modify these Terms of Service at any time. Users will be notified of significant changes via email or in-app notification.',
              'Continued use of the platform after changes take effect constitutes acceptance of the revised terms.',
              'We encourage users to review these terms periodically to stay informed about their rights and obligations.'
            ]
          }
        ].map((section, i) => (
          <div key={i} className="group">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[hsl(152,55%,45%)]/10 flex items-center justify-center flex-shrink-0 mt-1">
                <section.icon className="w-5 h-5 text-[hsl(152,55%,50%)]" />
              </div>
              <h2 className="text-2xl font-bold text-white">{section.title}</h2>
            </div>
            <div className="ml-14 space-y-4">
              {section.content.map((paragraph, j) => (
                <p key={j} className="text-[hsl(220,10%,65%)] leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
            {i < 4 && (
              <div className="border-b border-[hsl(220,15%,15%)] mt-12" />
            )}
          </div>
        ))}
      </main>

      {/* Footer */}
      <footer className="border-t border-[hsl(220,15%,15%)] py-8 px-4 mt-12">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[hsl(220,10%,45%)]">
            © {new Date().getFullYear()} Horizon Unit. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/privacy" className="text-[hsl(220,10%,45%)] hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/" className="text-[hsl(220,10%,45%)] hover:text-white transition-colors">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Database, Lock, UserCheck, Mail } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import logo from '@/assets/logo.png';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[hsl(220,20%,8%)] text-[hsl(220,10%,85%)]">
      <SEOHead
        title="Privacy Policy - Horizon Unit"
        description="Learn how Horizon Unit protects your personal data and privacy."
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
            <Shield className="w-8 h-8 text-[hsl(152,55%,50%)]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-[hsl(220,10%,55%)] text-lg">
            Last updated: March 8, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {[
          {
            icon: Eye,
            title: 'Information We Collect',
            content: [
              'When you create an account, we collect your full name, email address, and phone number. This information is necessary to provide our group savings services.',
              'We also collect contribution data including amounts, dates, and transaction records to maintain accurate savings records for your group.',
              'Usage data such as login times and feature interactions may be collected to improve our services.'
            ]
          },
          {
            icon: Database,
            title: 'How We Use Your Information',
            content: [
              'Your personal information is used to create and manage your savings account, process contributions, and communicate important updates about your group.',
              'We use your phone number to send contribution reminders and important notifications about your savings group activity.',
              'We do not sell, rent, or share your personal information with third parties for marketing purposes.'
            ]
          },
          {
            icon: Lock,
            title: 'Data Security',
            content: [
              'We implement industry-standard security measures to protect your personal data, including encryption at rest and in transit.',
              'Access to your data is restricted to authorized personnel only, and we regularly audit our security practices.',
              'Your financial data is stored securely and is only accessible to you and your group administrators.'
            ]
          },
          {
            icon: UserCheck,
            title: 'Your Rights',
            content: [
              'You have the right to access, update, or delete your personal information at any time through your account settings.',
              'You may request a copy of all data we hold about you by contacting our support team.',
              'You can opt out of non-essential communications while still receiving critical account notifications.'
            ]
          },
          {
            icon: Mail,
            title: 'Contact Us',
            content: [
              'If you have any questions or concerns about this Privacy Policy or our data practices, please reach out to our team.',
              'We are committed to resolving any privacy-related issues promptly and transparently.'
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
            <Link to="/terms" className="text-[hsl(220,10%,45%)] hover:text-white transition-colors">
              Terms of Service
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

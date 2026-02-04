import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { Loader2, Phone, Lock, User, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function UserRegister() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatPhoneEmail = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `${cleanPhone}@horizonunit.local`;
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Please enter your full name';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Please enter your phone number';
    } else if (phone.replace(/\D/g, '').length < 9) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!password) {
      newErrors.password = 'Please enter a password';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const email = formatPhoneEmail(phone);
      const cleanPhone = phone.replace(/\D/g, '');

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            phone_number: cleanPhone,
          },
        },
      });

      if (error) throw error;

      toast({
        title: 'Account created!',
        description: 'Welcome to Horizon Unit. You can now log in.',
      });
      navigate('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast({
        title: 'Registration failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEOHead 
        title="Join Horizon Unit - Free Member Account Sign Up"
        description="Create your member account with Horizon Unit. Join your savings group today. Simple registration with phone number and secure password. Start tracking your contributions now."
        keywords="signup, member account, group savings registration, create account, join savings group"
        ogTitle="Join Horizon Unit Today"
        ogDescription="Sign up in seconds and start saving with your group. No hidden fees, transparent tracking."
        canonical={typeof window !== 'undefined' ? `${window.location.origin}/register` : ''}
      />
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex flex-col items-center justify-center p-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo and Header */}
          <div className="text-center mb-12">
            <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 hover:opacity-80 transition-opacity">
              <img src={logo} alt="Horizon Unit" className="w-10 h-10 object-contain" />
            </Link>
            <h1 className="text-4xl font-bold text-foreground mb-2">Join Horizon Unit</h1>
            <p className="text-lg text-muted-foreground">Create your member account and start saving</p>
          </div>

          {/* Register Card */}
          <div className="bg-card border border-border rounded-2xl shadow-lg p-8 backdrop-blur-sm">
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Full Name Input */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) {
                      setErrors(prev => ({ ...prev, fullName: undefined }));
                    }
                  }}
                  className={`pl-10 h-11 rounded-lg transition-colors ${
                    errors.fullName ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                />
              </div>
              {errors.fullName && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {errors.fullName}
                </div>
              )}
            </div>

            {/* Phone Number Input */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0712345678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) {
                      setErrors(prev => ({ ...prev, phone: undefined }));
                    }
                  }}
                  className={`pl-10 h-11 rounded-lg transition-colors ${
                    errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                />
              </div>
              {errors.phone && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {errors.phone}
                </div>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password (min. 6 characters)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: undefined }));
                    }
                  }}
                  className={`pl-10 h-11 rounded-lg transition-colors ${
                    errors.password ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                />
              </div>
              {errors.password && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  className={`pl-10 h-11 rounded-lg transition-colors ${
                    errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                />
              </div>
              {errors.confirmPassword && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-11 rounded-lg text-base font-semibold mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-card text-muted-foreground">Already a member?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link to="/login">
            <Button 
              type="button"
              variant="outline" 
              className="w-full h-11 rounded-lg text-base font-semibold"
            >
              Sign In
            </Button>
          </Link>

          {/* Footer Text */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            By creating an account, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </>
  );
}

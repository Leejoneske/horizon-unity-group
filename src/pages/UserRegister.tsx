import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { sendWelcomeSMS } from '@/lib/sms-reminders';
import { SEOHead } from '@/components/SEOHead';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, Phone, Lock, User, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import logo from '@/assets/logo.png';

type Step = 'form' | 'otp';

export default function UserRegister() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    otp?: string;
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

  const handleSendOtp = async () => {
    if (!validateForm()) return;

    setIsSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone: phone.replace(/\D/g, '') },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to send code');

      toast({
        title: 'Verification code sent',
        description: 'Check your phone for the 6-digit code.',
      });
      setStep('otp');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send verification code';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (otpCode.length !== 6) {
      setErrors({ otp: 'Please enter the 6-digit code' });
      return;
    }

    setIsLoading(true);
    try {
      // Verify OTP first
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-otp', {
        body: { phone: phone.replace(/\D/g, ''), otp: otpCode },
      });

      if (verifyError) throw verifyError;
      if (!verifyData?.success) throw new Error(verifyData?.error || 'Invalid verification code');

      // OTP verified — now create the account
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

      // Send welcome SMS
      try {
        await sendWelcomeSMS(cleanPhone, fullName);
      } catch (smsErr) {
        console.error('Welcome SMS failed:', smsErr);
      }

      toast({
        title: 'Account created!',
        description: 'Welcome to Horizon Unit. You can now log in.',
      });
      navigate('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast({ title: 'Registration failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone: phone.replace(/\D/g, '') },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to resend code');
      toast({ title: 'Code resent', description: 'A new verification code has been sent.' });
      setOtpCode('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend code';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSendingOtp(false);
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-12">
            <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 hover:opacity-80 transition-opacity">
              <img src={logo} alt="Horizon Unit" className="w-10 h-10 object-contain" />
            </Link>
            <h1 className="text-4xl font-bold text-foreground mb-2">Join Horizon Unit</h1>
            <p className="text-lg text-muted-foreground">
              {step === 'form' ? 'Create your member account and start saving' : 'Verify your phone number'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-lg p-8 backdrop-blur-sm">
            {step === 'form' ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors(prev => ({ ...prev, fullName: undefined })); }}
                      className={`pl-10 h-11 rounded-lg transition-colors ${errors.fullName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                  </div>
                  {errors.fullName && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="w-4 h-4" />{errors.fullName}</div>}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0712345678"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined })); }}
                      className={`pl-10 h-11 rounded-lg transition-colors ${errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                  </div>
                  {errors.phone && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="w-4 h-4" />{errors.phone}</div>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password (min. 6 characters)"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })); }}
                      className={`pl-10 h-11 rounded-lg transition-colors ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                  </div>
                  {errors.password && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="w-4 h-4" />{errors.password}</div>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                      className={`pl-10 h-11 rounded-lg transition-colors ${errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                  </div>
                  {errors.confirmPassword && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="w-4 h-4" />{errors.confirmPassword}</div>}
                </div>

                <Button type="submit" className="w-full h-11 rounded-lg text-base font-semibold mt-6" disabled={isSendingOtp}>
                  {isSendingOtp ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending verification code...</>
                  ) : (
                    <><ShieldCheck className="mr-2 h-4 w-4" />Continue &amp; Verify Phone</>
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code sent to <span className="font-semibold text-foreground">{phone}</span>
                  </p>
                </div>

                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otpCode} onChange={(value) => { setOtpCode(value); if (errors.otp) setErrors(prev => ({ ...prev, otp: undefined })); }}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {errors.otp && <div className="flex items-center justify-center gap-2 text-sm text-destructive"><AlertCircle className="w-4 h-4" />{errors.otp}</div>}

                <Button onClick={handleVerifyAndRegister} className="w-full h-11 rounded-lg text-base font-semibold" disabled={isLoading || otpCode.length !== 6}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</>
                  ) : (
                    <><CheckCircle2 className="mr-2 h-4 w-4" />Verify &amp; Create Account</>
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={() => { setStep('form'); setOtpCode(''); }} className="text-muted-foreground hover:text-foreground transition-colors">
                    ← Change number
                  </button>
                  <button type="button" onClick={handleResendOtp} disabled={isSendingOtp} className="text-primary hover:underline disabled:opacity-50">
                    {isSendingOtp ? 'Sending...' : 'Resend code'}
                  </button>
                </div>

                <div className="bg-secondary rounded-xl p-4 text-xs text-muted-foreground space-y-2">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Can't get the OTP?
                  </p>
                  <ul className="space-y-1.5 list-disc list-inside">
                    <li>Check your <span className="font-medium text-foreground">SMS spam/blocked messages</span> folder</li>
                    <li>Dial <span className="font-mono font-semibold text-foreground">*456*9*5#</span> and accept all promotional messages, then try again</li>
                    <li>Make sure your phone number is correct and has network signal</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-card text-muted-foreground">Already a member?</span>
              </div>
            </div>

            <Link to="/login">
              <Button type="button" variant="outline" className="w-full h-11 rounded-lg text-base font-semibold">
                Sign In
              </Button>
            </Link>

            <p className="text-center text-xs text-muted-foreground mt-6">
              By creating an account, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function UserLogin() {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ credential?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Detect if input is email or phone
  const isEmailFormat = (input: string): boolean => {
    return input.includes('@');
  };

  // Validate inputs
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!credential.trim()) {
      newErrors.credential = 'Please enter your phone number or email';
    }
    if (!password) {
      newErrors.password = 'Please enter your password';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Convert phone to email format for auth
  const formatPhoneEmail = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `${cleanPhone}@horizonunit.local`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Determine if user entered email or phone
      let email: string;
      
      if (isEmailFormat(credential)) {
        // Admin login with email
        email = credential;
      } else {
        // User login with phone
        email = formatPhoneEmail(credential);
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      console.log('✓ User authenticated:', authData.user.id);

      // Check if user is admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      console.log('📋 Role check result:', roleData);
      if (roleError) console.error('Role check error:', roleError);

      toast({
        title: 'Welcome!',
        description: 'You have successfully logged in.',
      });

      // Route based on role
      if (roleData) {
        console.log('→ Routing to admin dashboard');
        navigate('/admin/dashboard');
      } else {
        console.log('→ Routing to user dashboard');
        navigate('/dashboard');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid credentials';
      toast({
        title: 'Login failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <img src={logo} alt="Horizon Unit" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your Horizon Unit account</p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Credential Input */}
            <div className="space-y-2">
              <Label htmlFor="credential" className="text-sm font-medium">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="credential"
                  type="text"
                  placeholder="0712345678"
                  value={credential}
                  onChange={(e) => {
                    setCredential(e.target.value);
                    if (errors.credential) {
                      setErrors(prev => ({ ...prev, credential: undefined }));
                    }
                  }}
                  className={`pl-10 h-11 rounded-lg transition-colors ${
                    errors.credential ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                />
              </div>
              {errors.credential && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {errors.credential}
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
                  placeholder="Enter your password"
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

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-11 rounded-lg text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Sign In
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
              <span className="px-2 bg-card text-muted-foreground">New to Horizon Unit?</span>
            </div>
          </div>

          {/* Register Link */}
          <Link to="/register">
            <Button 
              type="button"
              variant="outline" 
              className="w-full h-11 rounded-lg text-base font-semibold"
            >
              Create Account
            </Button>
          </Link>

          {/* Footer Text */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our Terms of Service
          </p>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Having trouble signing in?</p>
          <p className="mt-1">Contact your group admin for assistance</p>
        </div>
      </div>
    </div>
  );
}

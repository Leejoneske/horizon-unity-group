import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, Lock, Users } from 'lucide-react';

export default function UserLogin() {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Detect if input is email or phone
  const isEmailFormat = (input: string): boolean => {
    return input.includes('@');
  };

  // Convert phone to email format for auth
  const formatPhoneEmail = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `${cleanPhone}@horizonunit.local`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Horizon Unit</h1>
          <p className="text-muted-foreground mt-1">Login</p>
        </div>

        {/* Login Form */}
        <div className="finance-card">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credential">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="credential"
                  type="text"
                  placeholder="0712345678"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enter your phone number or email to continue
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

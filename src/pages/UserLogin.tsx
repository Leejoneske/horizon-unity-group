import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, Lock, Wallet, ArrowRight } from 'lucide-react';

export default function UserLogin() {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isEmailFormat = (input: string): boolean => {
    return input.includes('@');
  };

  const formatPhoneEmail = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `${cleanPhone}@horizonunit.local`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let email: string;
      
      if (isEmailFormat(credential)) {
        email = credential;
      } else {
        email = formatPhoneEmail(credential);
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      console.log('✓ User authenticated:', authData.user.id);

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
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-6">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Horizon Unit</h1>
          <p className="text-muted-foreground">Welcome back, member</p>
        </div>

        {/* Login Card */}
        <div className="finance-card mb-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="credential" className="text-sm font-semibold">Phone or Email</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  id="credential"
                  type="text"
                  placeholder="0712345678 or admin@email.com"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  className="pl-12 rounded-full py-6 text-base"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 rounded-full py-6 text-base"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-full py-6 text-base font-semibold bg-primary hover:bg-primary/90" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/50 text-center text-sm">
            <p className="text-muted-foreground mb-2">New to Horizon Unit?</p>
            <Link to="/register" className="text-primary font-semibold hover:text-primary/80 transition-colors">
              Create an account
            </Link>
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-xs text-muted-foreground">
          Members: use your phone number | Admins: use your email
        </p>
      </div>
    </div>
  );
}

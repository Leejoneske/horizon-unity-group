import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize admin user from environment variables (one-time setup)
const initializeAdminUser = async () => {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

  console.log('🔍 Checking admin initialization...');

  if (!adminEmail || !adminPassword) {
    console.warn('⚠️  Admin credentials not configured in environment variables');
    return;
  }

  console.log(`📧 Admin email: ${adminEmail}`);

  try {
    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing admin:', checkError);
    }

    if (existingAdmin) {
      console.log('✓ Admin user already exists');
      return;
    }

    console.log('Creating new admin user...');

    // Try to sign up the admin user
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          full_name: 'Admin',
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Error during sign up:', error.message);
      // If user already exists in auth but not in roles, just set the role
      if (error.message.includes('already registered') || error.message.includes('User already exists')) {
        console.log('✓ Admin email already registered in auth');
        
        // Try to sign in to get the user ID
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword,
        });

        if (signInError) {
          console.error('Could not sign in to verify admin:', signInError.message);
          return;
        }

        if (signInData.user) {
          // Check if admin role already exists
          const { data: existingRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', signInData.user.id)
            .eq('role', 'admin')
            .maybeSingle();

          if (!existingRole) {
            // Insert admin role
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: signInData.user.id,
                role: 'admin',
              });

            if (roleError) {
              console.error('Error setting admin role:', roleError);
            } else {
              console.log('✓ Admin role set');
            }
          } else {
            console.log('✓ Admin role confirmed');
          }

          await supabase.auth.signOut();
        }
        return;
      }
      console.error('Failed to create admin user:', error);
      return;
    }

    if (data.user) {
      console.log('✓ Admin user created:', data.user.id);
      // Insert admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role: 'admin',
        });

      if (roleError) {
        console.error('Error setting admin role:', roleError);
      } else {
        console.log('✓ Admin user initialized successfully');
      }
    }
  } catch (error) {
    console.error('Failed to initialize admin user:', error);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIsAdmin = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      return !!data;
    } catch (e) {
      console.error('Error fetching admin status:', e);
      return false;
    }
  };

  // Update user last login and online status when they sign in
  const updateUserActivity = async (userId: string) => {
    try {
      await supabase.from('profiles').update({
        last_login: new Date().toISOString(),
        is_online: true
      }).eq('user_id', userId);
    } catch (e) {
      console.warn('Could not update user activity:', e);
    }
  };

  const updateAuthState = async (currentSession: Session | null) => {
    if (currentSession?.user) {
      const admin = await fetchIsAdmin(currentSession.user.id);
      setUser(currentSession.user);
      setSession(currentSession);
      setIsAdmin(admin);
      // Update user activity when they're authenticated
      await updateUserActivity(currentSession.user.id);
    } else {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Initialize admin on app load (only once)
    initializeAdminUser();

    let mounted = true;

    // Get initial session first
    const getInitialSession = async () => {
      try {
        // Add timeout to prevent infinite loading
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session recovery timeout')), 5000)
        );

        const { data: { session: initialSession }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as Awaited<ReturnType<typeof supabase.auth.getSession>>;
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) setIsLoading(false);
          return;
        }

        if (mounted) {
          await updateAuthState(initialSession);
        }
      } catch (e) {
        console.error('Error getting initial session:', e);
        if (mounted) {
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        console.log('Auth event:', event);

        // Handle logout event
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          return;
        }

        // Handle sign in and token refresh
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          await updateAuthState(currentSession);
          return;
        }

        // Default: update state with current session
        await updateAuthState(currentSession);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setIsLoading(true);
      // Update last_login timestamp before signing out
      if (user) {
        try {
          await supabase
            .from('profiles')
            .update({ is_online: false })
            .eq('user_id', user.id);
        } catch (e) {
          console.warn('Could not update user status:', e);
        }
      }
      // Sign out from all sessions globally
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Sign out error:', error);
      }
      // Force clear state regardless of error
      setUser(null);
      setSession(null);
      setIsAdmin(false);
    } catch (e) {
      console.error('Error during sign out:', e);
      // Force clear even if error
      setUser(null);
      setSession(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

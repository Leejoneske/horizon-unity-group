import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  clearSessionExpired: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize admin user from environment variables (one-time setup)
// Uses localStorage flag to avoid running on every page load
const initializeAdminUser = async () => {
  // Skip if already initialized
  if (localStorage.getItem('admin_initialized') === 'true') {
    console.log('✓ Admin already initialized (cached)');
    return;
  }

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn('⚠️  Admin credentials not configured');
    return;
  }

  try {
    // Check if admin already exists using a simple query
    const { data: existingAdmin } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .maybeSingle();

    if (existingAdmin) {
      console.log('✓ Admin user already exists');
      localStorage.setItem('admin_initialized', 'true');
      return;
    }

    // IMPORTANT: Save current session before admin init so we can restore it
    const { data: { session: currentSession } } = await supabase.auth.getSession();

    console.log('Creating new admin user...');

    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: { full_name: 'Admin' },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('User already exists')) {
        console.log('✓ Admin email already registered in auth');
        // Don't sign in/out to check role - just mark as initialized
        // The admin role was already set during initial signup
        localStorage.setItem('admin_initialized', 'true');
      } else {
        console.error('Failed to create admin user:', error);
      }
      return;
    }

    if (data.user) {
      console.log('✓ Admin user created:', data.user.id);
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: data.user.id, role: 'admin' });

      if (roleError) {
        console.error('Error setting admin role:', roleError);
      } else {
        console.log('✓ Admin user initialized successfully');
      }
      
      // Sign out the newly created admin so it doesn't interfere with current user
      await supabase.auth.signOut({ scope: 'local' });
      
      // Restore previous session if one existed
      if (currentSession) {
        await supabase.auth.setSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
        });
      }
    }

    localStorage.setItem('admin_initialized', 'true');
  } catch (error) {
    console.error('Failed to initialize admin user:', error);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const clearSessionExpired = () => setSessionExpired(false);
  const isExplicitSignOut = useRef(false);

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
        updated_at: new Date().toISOString()
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
    let hadSession = false;

    // Set up auth state listener FIRST (before getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, { hasSession: !!currentSession });

        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          if (hadSession && !isExplicitSignOut.current) {
            setSessionExpired(true);
          }
          hadSession = false;
          isExplicitSignOut.current = false;
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        if (currentSession?.user) {
          hadSession = true;
        }

        if (currentSession?.user) {
          // Use setTimeout to avoid Supabase deadlock when querying during auth callback
          setTimeout(async () => {
            if (!mounted) return;
            await updateAuthState(currentSession);
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

    // Get initial session - this will trigger onAuthStateChange with INITIAL_SESSION
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Session error:', error.message);
        }

        if (!mounted) return;

        // If no session found, ensure loading stops
        if (!initialSession) {
          console.log('No session found');
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
        // If session exists, onAuthStateChange INITIAL_SESSION will handle it
      } catch (e) {
        console.error('Error during session recovery:', e);
        if (mounted) {
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Safety timeout - if still loading after 8 seconds, force stop
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout - forcing completion');
        setIsLoading(false);
      }
    }, 8000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signOut = async () => {
    try {
      isExplicitSignOut.current = true;
      setIsLoading(true);
      // Update last_login timestamp before signing out
      if (user) {
        try {
          await supabase
            .from('profiles')
            .update({ updated_at: new Date().toISOString() })
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
    <AuthContext.Provider value={{ user, session, isAdmin, isLoading, sessionExpired, clearSessionExpired, signOut }}>
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

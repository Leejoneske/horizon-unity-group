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
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    return !!data;
  };

  useEffect(() => {
    // Initialize admin on app load
    initializeAdminUser();

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Handle auth errors - if session refresh fails, clear it
        if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
          setIsLoading(true);
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const admin = await fetchIsAdmin(session.user.id);
            setIsAdmin(admin);
          } catch (e) {
            console.error('Error checking admin role:', e);
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }

        setIsLoading(false);
      }
    );

    // Then get initial session with error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        setIsLoading(true);
        
        // If there's an error getting session, clear it and don't proceed
        if (error) {
          console.error('Error getting session:', error);
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          fetchIsAdmin(session.user.id)
            .then((admin) => setIsAdmin(admin))
            .catch((e) => {
              console.error('Error checking admin role:', e);
              setIsAdmin(false);
            })
            .finally(() => setIsLoading(false));
        } else {
          setIsAdmin(false);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        console.error('Failed to get session:', e);
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
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

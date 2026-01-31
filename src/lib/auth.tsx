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

  if (!adminEmail || !adminPassword) {
    console.warn('Admin credentials not configured in environment variables');
    return;
  }

  try {
    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .maybeSingle();

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Try to sign up the admin user
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          full_name: 'Admin',
        },
      },
    });

    if (error) {
      // If user already exists in auth but not in roles, just set the role
      if (error.message.includes('already registered')) {
        console.log('Admin email already registered, checking role assignment');
        // The trigger should have created the role, no need to do anything
        return;
      }
      console.error('Error creating admin user:', error);
      return;
    }

    if (data.user) {
      // Ensure admin role is set
      await supabase
        .from('user_roles')
        .upsert({
          user_id: data.user.id,
          role: 'admin',
        }, {
          onConflict: 'user_id'
        });

      console.log('✓ Admin user initialized successfully');
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

  useEffect(() => {
    // Initialize admin on app load
    initializeAdminUser();

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check if user is admin using setTimeout to avoid Supabase deadlock
          setTimeout(async () => {
            const { data } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .eq('role', 'admin')
              .maybeSingle();
            setIsAdmin(!!data);
          }, 0);
        } else {
          setIsAdmin(false);
        }
        
        setIsLoading(false);
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .maybeSingle()
          .then(({ data }) => {
            setIsAdmin(!!data);
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
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

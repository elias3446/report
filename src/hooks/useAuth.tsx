
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, roleType?: 'admin' | 'user') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ error: any }>;
  hasUsers: boolean | null;
  hasProfile: boolean | null;
  profile: any | null;
  checkHasUsers: () => Promise<void>;
  checkUserProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Función para aplicar tema del usuario
  const applyUserTheme = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('theme')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user theme:', error);
        return;
      }

      const theme = data?.theme as 'dark' | 'light' | 'system' || 'system';
      
      if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        let effectiveTheme: 'dark' | 'light';
        
        if (theme === 'system') {
          effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
          effectiveTheme = theme;
        }
        
        root.classList.add(effectiveTheme);
        console.log('User theme applied on login:', theme, 'effective:', effectiveTheme);
      }
    } catch (error) {
      console.error('Error applying user theme:', error);
    }
  };

  const checkHasUsers = async () => {
    try {
      console.log('Checking for existing users...');
      const { data, error } = await supabase.rpc('has_users');
      if (error) {
        console.error('Error checking for users:', error);
        return;
      }
      console.log('Has users result:', data);
      setHasUsers(data);
    } catch (error) {
      console.error('Error checking for users:', error);
    }
  };

  const checkUserProfile = async () => {
    if (!user) {
      setHasProfile(null);
      setUserProfile(null);
      return;
    }

    try {
      console.log('Checking if user has profile...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking user profile:', error);
        return;
      }

      const userHasProfile = !!data;
      console.log('User has profile:', userHasProfile);
      setHasProfile(userHasProfile);
      setUserProfile(data);
    } catch (error) {
      console.error('Error checking user profile:', error);
    }
  };

  // Nueva función para refrescar el perfil forzadamente
  const refreshProfile = async () => {
    if (!user) return;

    try {
      console.log('Refreshing user profile...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error refreshing user profile:', error);
        return;
      }

      if (data) {
        console.log('Profile refreshed successfully:', data);
        setUserProfile(data);
        setHasProfile(true);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  // Función para verificar si el usuario actual es admin
  const isAdmin = () => {
    if (!userProfile || !userProfile.role) return false;
    return userProfile.role.includes('admin');
  };

  const resendConfirmation = async (email: string) => {
    try {
      console.log('Resending confirmation email to:', email);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        console.error('Error resending confirmation:', error);
      } else {
        console.log('Confirmation email resent successfully');
      }
      
      return { error };
    } catch (error) {
      console.error('Error in resendConfirmation:', error);
      return { error };
    }
  };

  useEffect(() => {
    let mounted = true;

    // Inicializar autenticación de forma secuencial
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth - checking for existing session...');
        
        // Primero verificar si hay una sesión existente
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (existingSession) {
          console.log('Found existing session:', existingSession);
          if (mounted) {
            setSession(existingSession);
            setUser(existingSession.user);
            
            // Aplicar tema del usuario inmediatamente
            applyUserTheme(existingSession.user.id);
            
            // Verificar perfil del usuario si hay sesión
            setTimeout(() => {
              if (mounted && existingSession.user) {
                checkUserProfile();
              }
            }, 0);
          }
        } else {
          console.log('No existing session found');
        }

        // Siempre verificar si hay usuarios en el sistema
        await checkHasUsers();

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Configurar listener de cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session);
        
        // Actualizar estado de sesión y usuario
        setSession(session);
        setUser(session?.user ?? null);
        
        // Manejar eventos específicos
        if (event === 'SIGNED_OUT' || !session) {
          console.log('User signed out, clearing profile data');
          setHasProfile(null);
          setUserProfile(null);
          
          // Verificar usuarios después de cerrar sesión
          setTimeout(() => {
            if (mounted) checkHasUsers();
          }, 0);
        } else if (event === 'SIGNED_IN' && session) {
          console.log('User signed in successfully');
          
          // Aplicar tema del usuario inmediatamente
          applyUserTheme(session.user.id);
          
          // Verificar perfil después de iniciar sesión
          setTimeout(() => {
            if (mounted) {
              checkHasUsers();
              checkUserProfile();
            }
          }, 0);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('Token refreshed, updating user data');
          
          // Verificar perfil después de refrescar token
          setTimeout(() => {
            if (mounted) checkUserProfile();
          }, 0);
        }
        
        // Solo marcar como no cargando después de procesar el evento
        if (event !== 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    );

    // Inicializar autenticación
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Verificar perfil cuando cambie el usuario
  useEffect(() => {
    if (user && !userProfile) {
      checkUserProfile();
    }
  }, [user, userProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, roleType?: 'admin' | 'user') => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // Preparar metadatos del usuario con información de rol si se especifica
      const userData: any = {
        first_name: firstName,
        last_name: lastName,
      };

      // Si se especifica un tipo de rol, incluirlo en los metadatos
      if (roleType) {
        userData.role = roleType === 'admin' ? ['admin', 'user'] : ['user'];
      }
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user...');
      
      // Limpiar estados locales inmediatamente
      setSession(null);
      setUser(null);
      setHasProfile(null);
      setUserProfile(null);
      
      // Realizar sign out con scope global para limpiar todas las sesiones
      await supabase.auth.signOut({ scope: 'global' });
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      resendConfirmation,
      hasUsers,
      hasProfile,
      profile: userProfile,
      checkHasUsers,
      checkUserProfile,
      refreshProfile,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

type Theme = 'dark' | 'light' | 'system';

export const useUserTheme = () => {
  const { user } = useAuth();

  // Obtener tema guardado del usuario
  const { data: userTheme } = useQuery({
    queryKey: ['user-theme', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('notification_settings')
        .select('theme')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user theme:', error);
        return null;
      }

      return data?.theme as Theme || null;
    },
    enabled: !!user,
  });

  // Aplicar tema del usuario al DOM
  const applyUserTheme = (theme: Theme) => {
    if (typeof window === 'undefined') return;
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let effectiveTheme: 'dark' | 'light';
    
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      effectiveTheme = theme;
    }
    
    root.classList.add(effectiveTheme);
    console.log('User theme applied:', theme, 'effective:', effectiveTheme);
  };

  // Aplicar tema automáticamente cuando se carga
  useEffect(() => {
    if (userTheme) {
      applyUserTheme(userTheme);
    }
  }, [userTheme]);

  return {
    userTheme,
    applyUserTheme
  };
};

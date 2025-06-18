
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Palette, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type Theme = 'dark' | 'light' | 'system';

export const ThemeConfig = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTheme, setSelectedTheme] = useState<Theme>('system');

  // Obtener configuración actual del tema
  const { data: currentTheme, isLoading } = useQuery({
    queryKey: ['user-theme-config', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('notification_settings')
        .select('theme')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user theme config:', error);
        return null;
      }

      return data?.theme as Theme || 'system';
    },
    enabled: !!user,
  });

  // Actualizar estado local cuando se carga la configuración
  useEffect(() => {
    if (currentTheme) {
      setSelectedTheme(currentTheme);
    }
  }, [currentTheme]);

  // Aplicar tema inmediatamente
  const applyTheme = (theme: Theme) => {
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
    console.log('Theme config applied:', theme, 'effective:', effectiveTheme);
  };

  // Guardar configuración de tema
  const saveThemeMutation = useMutation({
    mutationFn: async (theme: Theme) => {
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          theme: theme,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      return theme;
    },
    onSuccess: (theme) => {
      // Aplicar tema inmediatamente
      applyTheme(theme);
      
      // Invalidar queries para que otros componentes se actualicen
      queryClient.invalidateQueries({ queryKey: ['user-theme-config'] });
      queryClient.invalidateQueries({ queryKey: ['user-theme'] });
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      
      toast({
        title: 'Tema guardado',
        description: 'La configuración del tema se ha actualizado correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar la configuración del tema',
        variant: 'destructive',
      });
    },
  });

  const handleSaveTheme = () => {
    saveThemeMutation.mutate(selectedTheme);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Tema de la aplicación</Label>
        <div className="animate-pulse bg-muted h-10 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Tema de la aplicación (Permanente)
        </Label>
        <Select
          value={selectedTheme}
          onValueChange={(value) => setSelectedTheme(value as Theme)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border">
            <SelectItem value="light">Claro</SelectItem>
            <SelectItem value="dark">Oscuro</SelectItem>
            <SelectItem value="system">Sistema</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Selecciona el tema visual permanente de la aplicación. Esta configuración se guardará en tu perfil.
        </p>
      </div>

      <Button
        onClick={handleSaveTheme}
        disabled={saveThemeMutation.isPending || selectedTheme === currentTheme}
        className="flex items-center gap-2"
      >
        <Save className="h-4 w-4" />
        {saveThemeMutation.isPending ? 'Guardando...' : 'Guardar tema'}
      </Button>
    </div>
  );
};

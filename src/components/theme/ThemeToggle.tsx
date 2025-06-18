
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUserTheme } from '@/hooks/useUserTheme';

type Theme = 'dark' | 'light' | 'system';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>('system');
  const { userTheme } = useUserTheme();

  // Función para obtener el tema del sistema
  const getSystemTheme = (): 'dark' | 'light' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Función para aplicar el tema temporalmente
  const applyTheme = (currentTheme: Theme) => {
    if (typeof window === 'undefined') return;
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let effectiveTheme: 'dark' | 'light';
    
    if (currentTheme === 'system') {
      effectiveTheme = getSystemTheme();
    } else {
      effectiveTheme = currentTheme;
    }
    
    root.classList.add(effectiveTheme);
    console.log('Temporary theme applied:', currentTheme, 'effective:', effectiveTheme);
  };

  // Inicializar con el tema del usuario si existe, sino usar sistema
  useEffect(() => {
    if (userTheme) {
      // Mostrar el tema del usuario en el toggle
      setTheme(userTheme);
      console.log('ThemeToggle showing user theme:', userTheme);
    } else {
      // Solo usar tema del sistema si no hay tema del usuario
      const initialTheme: Theme = 'system';
      setTheme(initialTheme);
      applyTheme(initialTheme);
      console.log('No user theme found, using system theme in ThemeToggle');
    }
  }, [userTheme]);

  // Escuchar cambios en las preferencias del sistema solo si el tema temporal es 'system' Y no hay tema del usuario
  useEffect(() => {
    if (typeof window === 'undefined' || theme !== 'system' || userTheme) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system' && !userTheme) {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
        console.log('System theme changed to:', e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme, userTheme]);

  const handleThemeChange = (newTheme: Theme) => {
    console.log('Temporary theme changed to:', newTheme);
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema (temporal)</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border z-50">
        <DropdownMenuItem 
          onClick={() => handleThemeChange('light')}
          className="cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Claro</span>
          {theme === 'light' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange('dark')}
          className="cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Oscuro</span>
          {theme === 'dark' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange('system')}
          className="cursor-pointer"
        >
          <span className="mr-2">💻</span>
          <span>Sistema</span>
          {theme === 'system' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

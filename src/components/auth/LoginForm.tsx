
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { toast } from '@/hooks/use-toast';
import { Loader2, LogIn, Shield } from 'lucide-react';
import { PasswordRecovery } from './PasswordRecovery';
import { validateSecureEmail } from '@/utils/securityValidations';
import { generateCSRFToken } from '@/utils/securityEnhancements';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const { secureSignIn, loginAttempts } = useSecureAuth();

  // Generate CSRF token on component mount
  useEffect(() => {
    setCsrfToken(generateCSRFToken());
  }, []);

  // Solo aplicar tema del sistema en el LoginForm, no después del login
  useEffect(() => {
    // Aplicar tema del sistema solo para la página de login
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      console.log('Login form system theme applied:', systemTheme);
    }

    // Limpiar al desmontar el componente (cuando se hace login exitoso)
    return () => {
      console.log('LoginForm unmounted - user theme will be applied by AuthProvider');
    };
  }, []);

  const getErrorMessage = (error: any) => {
    if (!error?.message) return "Ocurrió un error inesperado";
    
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('email not confirmed')) {
      return "Tu email aún no ha sido confirmado. Por favor, revisa tu bandeja de entrada y haz clic en el enlace de confirmación.";
    }
    
    if (errorMessage.includes('invalid login credentials')) {
      return "Las credenciales de acceso son incorrectas. Verifica tu email y contraseña.";
    }
    
    if (errorMessage.includes('email address not found')) {
      return "No existe una cuenta con este email. ¿Necesitas registrarte?";
    }
    
    if (errorMessage.includes('rate limited')) {
      return "Demasiados intentos de acceso. Por favor, espera unos minutos antes de intentar nuevamente.";
    }
    
    if (errorMessage.includes('signup is disabled')) {
      return "El registro está deshabilitado en este momento.";
    }
    
    // Error genérico para otros casos
    return "Error de autenticación. Verifica tus credenciales e intenta nuevamente.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Client-side validation
      const emailValidation = validateSecureEmail(email);
      if (!emailValidation.isValid) {
        toast({
          title: "Error de validación",
          description: emailValidation.error,
          variant: "destructive",
        });
        return;
      }

      if (!password.trim()) {
        toast({
          title: "Error de validación",
          description: "La contraseña es requerida",
          variant: "destructive",
        });
        return;
      }

      const { error } = await secureSignIn(email, password);
      
      if (error) {
        toast({
          title: "Error de autenticación",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Bienvenido",
          description: "Has iniciado sesión exitosamente",
        });
        // El tema del usuario será aplicado automáticamente por el AuthProvider
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show security warning if too many failed attempts
  const recentFailedAttempts = loginAttempts.filter(
    attempt => !attempt.success && Date.now() - attempt.timestamp < 15 * 60 * 1000
  ).length;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder a la aplicación
          </CardDescription>
          {recentFailedAttempts > 2 && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2 text-yellow-800">
                <Shield className="h-4 w-4" />
                <span className="text-sm">
                  Múltiples intentos fallidos detectados. Verifica tus credenciales.
                </span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="csrf_token" value={csrfToken} />
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowPasswordRecovery(true)}
              className="text-sm text-primary hover:text-primary/80 underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </CardContent>
      </Card>

      <PasswordRecovery 
        open={showPasswordRecovery} 
        onOpenChange={setShowPasswordRecovery} 
      />
    </div>
  );
};

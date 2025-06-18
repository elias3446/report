import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { toast } from '@/hooks/use-toast';
import { Loader2, UserCog, AlertTriangle } from 'lucide-react';
import { validateSecureEmail, validateSecurePassword } from '@/utils/securityValidations';
import { generateCSRFToken } from '@/utils/securityEnhancements';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export const InitialSetup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { signOut, checkHasUsers } = useAuth();
  const { secureSignUp } = useSecureAuth();

  // Generate CSRF token on component mount
  useEffect(() => {
    setCsrfToken(generateCSRFToken());
  }, []);

  // Monitor password strength
  useEffect(() => {
    if (password) {
      const validation = validateSecurePassword(password);
      setPasswordStrength(validation.strength * 20);
    } else {
      setPasswordStrength(0);
    }
  }, [password]);

  // Aplicar siempre el tema del sistema en la configuración inicial
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applySystemTheme = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      
      console.log('InitialSetup: Applied system theme:', systemTheme);
    };

    // Aplicar tema del sistema inicial
    applySystemTheme();

    // Escuchar cambios en las preferencias del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(e.matches ? 'dark' : 'light');
      console.log('InitialSetup: System theme changed to:', e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  const getErrorMessage = (error: any) => {
    if (!error?.message) return "Ocurrió un error inesperado";
    
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('user already registered')) {
      return "Ya existe una cuenta con este email. Intenta iniciar sesión en su lugar.";
    }
    
    if (errorMessage.includes('password should be at least')) {
      return "La contraseña debe tener al menos 8 caracteres.";
    }
    
    if (errorMessage.includes('signup is disabled')) {
      return "El registro está deshabilitado en este momento.";
    }
    
    if (errorMessage.includes('invalid email')) {
      return "El formato del email no es válido.";
    }
    
    if (errorMessage.includes('weak password')) {
      return "La contraseña es muy débil. Debe cumplir con los requisitos de seguridad.";
    }
    
    return error.message || "Error durante el registro. Intenta nuevamente.";
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 60) return 'bg-yellow-500';
    if (strength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength < 40) return 'Débil';
    if (strength < 60) return 'Regular';
    if (strength < 80) return 'Buena';
    return 'Excelente';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced client-side validation
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailValidation = validateSecureEmail(email);
    if (!emailValidation.isValid) {
      toast({
        title: "Error de validación",
        description: emailValidation.error,
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    const passwordValidation = validateSecurePassword(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Error de validación",
        description: passwordValidation.error,
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (passwordStrength < 80) {
      toast({
        title: "Error",
        description: "La contraseña debe tener una fortaleza mínima de 80%",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await signOut();

      const { error } = await secureSignUp(email, password, firstName, lastName);
      
      if (error) {
        toast({
          title: "Error en el registro",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Cuenta creada exitosamente!",
          description: "Tu cuenta de administrador ha sido creada.",
        });
        
        setRedirecting(true);
        
        setTimeout(async () => {
          await signOut();
          checkHasUsers();
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <UserCog className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Configuración Inicial</CardTitle>
          <CardDescription>
            Bienvenido! Crea tu cuenta de administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="csrf_token" value={csrfToken} />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Tu nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={loading || redirecting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Tu apellido"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={loading || redirecting}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || redirecting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading || redirecting}
              />
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={passwordStrength} 
                      className="flex-1 h-2"
                    />
                    <span className="text-xs font-medium">
                      {getStrengthText(passwordStrength)}
                    </span>
                  </div>
                  <div className={`h-1 rounded-full ${getStrengthColor(passwordStrength)}`} />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirma tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading || redirecting}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || redirecting || passwordStrength < 80}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : redirecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirigiendo al login...
                </>
              ) : (
                'Crear Cuenta de Administrador'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

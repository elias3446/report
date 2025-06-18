
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Save, X, Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSecurity } from '@/hooks/useSecurity';
import { validateSecurePassword } from '@/utils/securityValidations';
import { sanitizeUserInput } from '@/utils/securityEnhancements';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UsuarioPasswordEditProps {
  onBack: () => void;
}

const passwordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'La contraseña actual es requerida'),
  newPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres')
    .refine((password) => {
      const validation = validateSecurePassword(password);
      return validation.isValid;
    }, 'La contraseña no cumple con los requisitos de seguridad'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export const UsuarioPasswordEdit: React.FC<UsuarioPasswordEditProps> = ({ onBack }) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { logSecurityEvent } = useSecurity();
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Watch new password for strength indicator
  const newPassword = form.watch('newPassword');
  
  React.useEffect(() => {
    if (newPassword) {
      const validation = validateSecurePassword(newPassword);
      setPasswordStrength(validation.strength * 20);
    } else {
      setPasswordStrength(0);
    }
  }, [newPassword]);

  // Enhanced password update mutation with security logging
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      // Log password change attempt
      await logSecurityEvent(
        'PASSWORD_CHANGE_ATTEMPT',
        'User attempted to change password',
        { timestamp: new Date().toISOString() }
      );

      // Verify current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: data.currentPassword
      });

      if (signInError) {
        await logSecurityEvent(
          'PASSWORD_CHANGE_FAILED',
          'Current password verification failed',
          { error: signInError.message }
        );
        throw new Error('La contraseña actual es incorrecta');
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) {
        await logSecurityEvent(
          'PASSWORD_CHANGE_FAILED',
          'Password update failed',
          { error: error.message }
        );
        throw error;
      }

      // Log successful password change
      await logSecurityEvent(
        'PASSWORD_CHANGE_SUCCESS',
        'Password changed successfully',
        { timestamp: new Date().toISOString() }
      );

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente por seguridad.",
      });
      
      form.reset();
      onBack();
    },
    onError: (error: any) => {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la contraseña. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: PasswordFormData) => {
    // Sanitize inputs
    const sanitizedData = {
      currentPassword: sanitizeUserInput(data.currentPassword),
      newPassword: sanitizeUserInput(data.newPassword),
      confirmPassword: sanitizeUserInput(data.confirmPassword)
    };
    
    updatePasswordMutation.mutate(sanitizedData);
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

  return (
    <Card>
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
          Cambiar Contraseña
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Seguridad:</strong> Por tu seguridad, necesitamos verificar tu contraseña actual antes de cambiarla.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña Actual *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Ingresa tu contraseña actual" 
                        {...field} 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva Contraseña *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input 
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Ingresa tu nueva contraseña" 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {newPassword && (
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Nueva Contraseña *</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Confirma tu nueva contraseña" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Requisitos de contraseña:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs sm:text-sm">
                  <li>Mínimo 8 caracteres</li>
                  <li>Al menos una mayúscula y una minúscula</li>
                  <li>Al menos un número</li>
                  <li>Al menos un carácter especial (!@#$%^&*)</li>
                  <li>No debe contener patrones comunes</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                type="submit" 
                disabled={updatePasswordMutation.isPending || passwordStrength < 80}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Save className="h-4 w-4" />
                {updatePasswordMutation.isPending ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={onBack}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

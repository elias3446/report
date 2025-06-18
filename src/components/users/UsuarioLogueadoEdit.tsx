import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User, Save, ArrowLeft, Lock, Camera, Upload } from 'lucide-react';
import { isValidEmail } from '@/utils/validations';
import { useToast } from '@/hooks/use-toast';
import { UsuarioPasswordEdit } from './UsuarioPasswordEdit';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCloudinary } from '@/hooks/useCloudinary';
import { AvatarPreviewModal } from './AvatarPreviewModal';

interface UsuarioLogueadoEditProps {
  onClose: () => void;
  onBack: () => void;
}

const editUserSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  email: z.string()
    .min(1, 'El email es requerido')
    .refine((email) => isValidEmail(email), {
      message: 'Debe ser un email válido según RFC 5322'
    }),
});

type EditFormData = z.infer<typeof editUserSchema>;

export const UsuarioLogueadoEdit: React.FC<UsuarioLogueadoEditProps> = ({ onClose, onBack }) => {
  const { user, checkUserProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('perfil');
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const isMobile = useIsMobile();
  const { uploadImage, isUploading } = useCloudinary();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Obtener datos del perfil del usuario logueado
  const { data: perfilUsuario, isLoading } = useQuery({
    queryKey: ['perfil-usuario-logueado', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  const form = useForm<EditFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      first_name: perfilUsuario?.first_name || '',
      last_name: perfilUsuario?.last_name || '',
      email: perfilUsuario?.email || '',
    },
  });

  // Actualizar valores del formulario cuando se cargan los datos
  React.useEffect(() => {
    if (perfilUsuario) {
      form.reset({
        first_name: perfilUsuario.first_name || '',
        last_name: perfilUsuario.last_name || '',
        email: perfilUsuario.email || '',
      });
    }
  }, [perfilUsuario, form]);

  // Manejar selección de archivo de imagen
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP).",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño de archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Error", 
        description: "La imagen no puede ser mayor a 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        setNewAvatarUrl(imageUrl);
        toast({
          title: "Imagen subida",
          description: "Tu foto de perfil se ha subido correctamente.",
        });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  // Iniciar cámara
  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Verifica los permisos.",
        variant: "destructive",
      });
      setIsCapturing(false);
    }
  };

  // Detener cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  // Capturar foto
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      
      try {
        const imageUrl = await uploadImage(file);
        if (imageUrl) {
          setNewAvatarUrl(imageUrl);
          toast({
            title: "Foto capturada",
            description: "Tu foto de perfil se ha capturado y subido correctamente.",
          });
          stopCamera();
        }
      } catch (error) {
        console.error('Error uploading camera capture:', error);
        toast({
          title: "Error",
          description: "No se pudo procesar la foto. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    }, 'image/jpeg', 0.8);
  };

  // Mutación para actualizar el perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      if (!user?.id) throw new Error('Usuario no encontrado');

      // Actualizar en la tabla profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          avatar: newAvatarUrl || perfilUsuario?.avatar,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // Si el email cambió, actualizar en auth.users también
      if (data.email !== perfilUsuario?.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: data.email
        });

        if (authError) {
          console.error('Error updating auth email:', authError);
          throw authError;
        }
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Perfil actualizado",
        description: "Tu información personal ha sido actualizada correctamente.",
      });
      
      // Invalidar todas las queries relacionadas con el perfil del usuario
      queryClient.invalidateQueries({ queryKey: ['perfil-usuario-logueado'] });
      
      // Forzar actualización del contexto de autenticación
      checkUserProfile();
      
      // Volver a la vista de detalle
      onBack();
    },
    onError: (error: any) => {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: EditFormData) => {
    updateProfileMutation.mutate(data);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  };

  const currentAvatarUrl = newAvatarUrl || perfilUsuario?.avatar;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!perfilUsuario) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No se pudo cargar la información del usuario.</p>
            <Button onClick={onClose} className="mt-4">
              Cerrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full">
            <Button 
              onClick={onBack} 
              variant="outline" 
              size="sm"
              className="flex-shrink-0 mt-1 sm:mt-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {!isMobile && "Volver"}
            </Button>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex-shrink-0">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold">Editar Mi Perfil</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Actualiza tu información personal
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de edición */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="perfil" className="flex items-center gap-2 p-3">
              <User className="h-4 w-4" />
              <span className="text-sm sm:text-base">Información Personal</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2 p-3">
              <Lock className="h-4 w-4" />
              <span className="text-sm sm:text-base">Contraseña</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perfil">
            <Card>
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
                    {/* Sección de Avatar */}
                    <div className="flex flex-col items-center gap-4 pb-6 border-b">
                      <Avatar 
                        className="h-24 w-24 sm:h-32 sm:w-32 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setShowAvatarPreview(true)}
                      >
                        <AvatarImage 
                          src={currentAvatarUrl || undefined} 
                          alt="Foto de perfil" 
                        />
                        <AvatarFallback className="text-lg sm:text-xl">
                          {getInitials(perfilUsuario.first_name, perfilUsuario.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Cámara en vivo si está capturando */}
                      {isCapturing && (
                        <div className="relative">
                          <video
                            ref={videoRef}
                            className="w-64 h-48 rounded-lg border"
                            autoPlay
                            playsInline
                            muted
                          />
                          <canvas
                            ref={canvasRef}
                            className="hidden"
                          />
                          <div className="flex gap-2 mt-2">
                            <Button
                              type="button"
                              onClick={capturePhoto}
                              disabled={isUploading}
                              size="sm"
                            >
                              Capturar
                            </Button>
                            <Button
                              type="button"
                              onClick={stopCamera}
                              variant="outline"
                              size="sm"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {!isCapturing && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              disabled={isUploading}
                              className="flex items-center gap-2"
                            >
                              <Upload className="h-4 w-4" />
                              {isUploading ? 'Subiendo...' : 'Subir Imagen'}
                            </Button>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              disabled={isUploading}
                            />
                          </div>
                          
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            disabled={isUploading}
                            onClick={startCamera}
                            className="flex items-center gap-2"
                          >
                            <Camera className="h-4 w-4" />
                            Usar Cámara
                          </Button>
                        </div>
                      )}
                      
                      <p className="text-xs sm:text-sm text-muted-foreground text-center">
                        Formatos soportados: JPG, PNG, GIF, WebP. Máximo 5MB.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ingresa tu nombre" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellido *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ingresa tu apellido" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="tu@email.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                          {form.watch('email') !== perfilUsuario?.email && (
                            <p className="text-sm text-muted-foreground">
                              ⚠️ Al cambiar tu email, recibirás un correo de confirmación.
                            </p>
                          )}
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-start">
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending || isUploading}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <UsuarioPasswordEdit onBack={() => setActiveTab('perfil')} />
          </TabsContent>
        </Tabs>

        {/* Avatar Preview Modal */}
        <AvatarPreviewModal
          isOpen={showAvatarPreview}
          onClose={() => setShowAvatarPreview(false)}
          avatarUrl={currentAvatarUrl}
          userName={perfilUsuario.first_name && perfilUsuario.last_name 
            ? `${perfilUsuario.first_name} ${perfilUsuario.last_name}`
            : perfilUsuario.first_name || perfilUsuario.last_name || undefined
          }
          userEmail={perfilUsuario.email || user?.email}
        />
      </div>
    </div>
  );
};

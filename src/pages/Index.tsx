
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { InitialSetup } from '@/components/auth/InitialSetup';
import { LoginForm } from '@/components/auth/LoginForm';
import Home from './Home';
import { Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Index = () => {
  const { user, loading, hasUsers, hasProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('Index render - user:', user, 'loading:', loading, 'hasUsers:', hasUsers, 'hasProfile:', hasProfile);

  // Redirigir a login cuando no hay usuario autenticado
  useEffect(() => {
    // No hacer nada si estamos cargando
    if (loading) return;
    
    // Si no hay usuario y no estamos en la página raíz, redirigir a login
    if (!user && location.pathname !== '/') {
      console.log('No user found, redirecting to login from:', location.pathname);
      navigate('/', { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  // Solo mostrar loading si realmente estamos en el estado inicial de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando estado de la aplicación...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuarios en el sistema, mostrar configuración inicial
  if (hasUsers === false) {
    return <InitialSetup />;
  }

  // Si hay usuarios pero no hay sesión activa, mostrar login directamente
  if (!user && hasUsers === true) {
    return <LoginForm />;
  }

  // Si hay un usuario autenticado, verificar si tiene perfil
  if (user && hasProfile === false) {
    return <InitialSetup />;
  }

  // Si tiene perfil o estamos verificando el perfil, mostrar página de inicio
  if (user && (hasProfile === true || hasProfile === null)) {
    return <Home />;
  }

  // Fallback - mostrar login
  return <LoginForm />;
};

export default Index;

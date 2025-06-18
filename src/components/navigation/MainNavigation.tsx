import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import { 
  FileText, 
  Map, 
  Settings, 
  User, 
  LogOut,
  ChevronDown,
  Plus,
  LayoutDashboard,
  Menu
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useSecurity } from '@/hooks/useSecurity';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { AvatarPreviewModal } from '@/components/users/AvatarPreviewModal';

const navigationItems = [
  { name: 'Reportes Públicos', href: '/reportes-publicos', icon: FileText },
  { name: 'Mapa', href: '/mapa-reportes', icon: Map },
];

export const MainNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { hasPermission, isAdmin } = useSecurity();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);

  console.log('MainNavigation - Profile data:', profile);
  console.log('MainNavigation - Avatar URL:', profile?.avatar);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión exitosamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cerrar la sesión',
        variant: 'destructive',
      });
    }
  };

  // Check if user can create reports (and is not admin)
  const canCreateReports = hasPermission('crear_reporte') && !isAdmin();
  
  // Check if user is admin
  const userIsAdmin = isAdmin();

  // Combine all navigation items
  const allNavigationItems = [
    ...navigationItems,
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ...(userIsAdmin ? [{ name: 'Admin', href: '/admin', icon: Settings }] : []),
  ];

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href);

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || user?.email?.charAt(0)?.toUpperCase() || 'U';
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link to="/home" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="hidden sm:block text-xl font-bold text-gray-900 dark:text-white">
                  GeoReport
                </span>
              </Link>
            </div>

            {/* Center navigation - Show only above 965px (lg breakpoint is 1024px, we use custom classes) */}
            <div className="hidden lg:flex flex-1 justify-center max-w-3xl mx-4">
              <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-hide">
                {allNavigationItems.map((item) => {
                  const Icon = item.icon;
                  const itemIsActive = isActive(item.href);
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                        itemIsActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                
                {/* Nuevo Reporte Button - Only show if user can create reports AND is not admin */}
                {canCreateReports && (
                  <Link
                    to="/nuevo-reporte"
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap bg-green-600 hover:bg-green-700 text-white",
                      location.pathname === '/nuevo-reporte' && "bg-green-700"
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nuevo Reporte</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Right side - Responsive layout */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Mobile Navigation - Drawer - Show below 1024px (lg breakpoint) */}
              <div className="lg:hidden">
                <Drawer open={isOpen} onOpenChange={setIsOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Abrir menú de navegación</span>
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="bg-white dark:bg-gray-800">
                    <DrawerHeader>
                      <DrawerTitle>Navegación</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-4">
                      <div className="space-y-2">
                        {allNavigationItems.map((item) => {
                          const Icon = item.icon;
                          const itemIsActive = isActive(item.href);
                          
                          return (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() => setIsOpen(false)}
                              className={cn(
                                "flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors w-full",
                                itemIsActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                              )}
                            >
                              <Icon className="h-5 w-5" />
                              <span>{item.name}</span>
                            </Link>
                          );
                        })}
                        
                        {/* Nuevo Reporte Button - Only show if user can create reports AND is not admin */}
                        {canCreateReports && (
                          <Link
                            to="/nuevo-reporte"
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors w-full bg-green-600 hover:bg-green-700 text-white",
                              location.pathname === '/nuevo-reporte' && "bg-green-700"
                            )}
                          >
                            <Plus className="h-5 w-5" />
                            <span>Nuevo Reporte</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>

              {/* Notifications */}
              <NotificationsBell />
              
              {/* Theme toggle */}
              <ThemeToggle />

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3">
                    <Avatar 
                      className="h-6 w-6 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAvatarPreview(true);
                      }}
                    >
                      <AvatarImage 
                        src={profile?.avatar || ''} 
                        alt="Avatar del usuario"
                        onError={(e) => {
                          console.log('MainNavigation - Error loading avatar:', e);
                          console.log('MainNavigation - Avatar URL attempted:', profile?.avatar);
                        }}
                        onLoad={() => {
                          console.log('MainNavigation - Avatar loaded successfully:', profile?.avatar);
                        }}
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(profile?.first_name, profile?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm">
                      {profile?.first_name || user?.email?.split('@')[0] || 'Usuario'}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 z-50">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/mi-perfil" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Mi Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/configuracion" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configuración</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Avatar Preview Modal */}
      <AvatarPreviewModal
        isOpen={showAvatarPreview}
        onClose={() => setShowAvatarPreview(false)}
        avatarUrl={profile?.avatar}
        userName={profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : profile?.first_name || profile?.last_name || undefined
        }
        userEmail={profile?.email || user?.email}
      />
    </>
  );
};

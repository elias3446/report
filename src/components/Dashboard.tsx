
import { useState, useEffect } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Users, Shield, FolderOpen, Circle, FileText, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UsersManagement } from '@/components/users/UsersManagement';
import { RolesManagement } from '@/components/roles/RolesManagement';
import { CategoriesManagement } from '@/components/categories/CategoriesManagement';
import { EstadosManagement } from '@/components/estados/EstadosManagement';
import { ReportesManagement } from '@/components/reportes/ReportesManagement';
import { AuditoriaManagement } from '@/components/auditoria/AuditoriaManagement';
import { cn } from '@/lib/utils';

export const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get the active tab from URL params, default to 'reportes'
  const activeTab = searchParams.get('tab') || 'reportes';

  const adminMenuItems = [
    { 
      value: 'reportes', 
      label: 'Reportes', 
      icon: FileText,
      href: '/admin?tab=reportes'
    },
    { 
      value: 'users', 
      label: 'Usuarios', 
      icon: Users,
      href: '/admin?tab=users'
    },
    { 
      value: 'roles', 
      label: 'Roles', 
      icon: Shield,
      href: '/admin?tab=roles'
    },
    { 
      value: 'categories', 
      label: 'Categorías', 
      icon: FolderOpen,
      href: '/admin?tab=categories'
    },
    { 
      value: 'estados', 
      label: 'Estados', 
      icon: Circle,
      href: '/admin?tab=estados'
    },
    { 
      value: 'auditoria', 
      label: 'Auditoría', 
      icon: Shield,
      href: '/admin?tab=auditoria'
    },
  ];

  const isActive = (tabValue: string) => activeTab === tabValue;

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UsersManagement />;
      case 'roles':
        return <RolesManagement />;
      case 'categories':
        return <CategoriesManagement />;
      case 'estados':
        return <EstadosManagement />;
      case 'auditoria':
        return <AuditoriaManagement />;
      case 'reportes':
      default:
        return <ReportesManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Responsive Navigation Menu */}
        <div className="mb-6">
          <nav className="bg-background border rounded-lg p-1">
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-1">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.value}
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive(item.value)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Navigation - Hamburger Menu */}
            <div className="md:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {adminMenuItems.find(item => isActive(item.value)) && (
                    <>
                      {(() => {
                        const activeItem = adminMenuItems.find(item => isActive(item.value));
                        const Icon = activeItem.icon;
                        return (
                          <>
                            <Icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{activeItem.label}</span>
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
                
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Abrir menú de administración</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64">
                    <div className="flex flex-col space-y-4 mt-4">
                      <div className="text-lg font-semibold">Administración</div>
                      
                      <div className="space-y-2">
                        {adminMenuItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.value}
                              to={item.href}
                              onClick={() => setIsOpen(false)}
                              className={cn(
                                "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                isActive(item.value)
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </nav>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

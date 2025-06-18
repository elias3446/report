
import React from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/toaster";
import { 
  FileText, 
  Users, 
  Shield, 
  FolderOpen, 
  Circle,
  Menu,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReportesAnalytics } from '@/components/analytics/ReportesAnalytics';
import { UsuariosAnalytics } from '@/components/analytics/UsuariosAnalytics';
import { RolesAnalytics } from '@/components/analytics/RolesAnalytics';
import { CategoriasAnalytics } from '@/components/analytics/CategoriasAnalytics';
import { EstadosAnalytics } from '@/components/analytics/EstadosAnalytics';
import { useState } from 'react';

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get the active tab from URL params, default to 'reportes'
  const activeTab = searchParams.get('tab') || 'reportes';

  const analyticsMenuItems = [
    { 
      value: 'reportes', 
      label: 'Reportes', 
      icon: FileText,
      href: '/dashboard?tab=reportes'
    },
    { 
      value: 'usuarios', 
      label: 'Usuarios', 
      icon: Users,
      href: '/dashboard?tab=usuarios'
    },
    { 
      value: 'roles', 
      label: 'Roles', 
      icon: Shield,
      href: '/dashboard?tab=roles'
    },
    { 
      value: 'categorias', 
      label: 'Categorías', 
      icon: FolderOpen,
      href: '/dashboard?tab=categorias'
    },
    { 
      value: 'estados', 
      label: 'Estados', 
      icon: Circle,
      href: '/dashboard?tab=estados'
    },
  ];

  const isActive = (tabValue: string) => activeTab === tabValue;

  const renderContent = () => {
    switch (activeTab) {
      case 'usuarios':
        return <UsuariosAnalytics />;
      case 'roles':
        return <RolesAnalytics />;
      case 'categorias':
        return <CategoriasAnalytics />;
      case 'estados':
        return <EstadosAnalytics />;
      case 'reportes':
      default:
        return <ReportesAnalytics />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Dashboard Analítico
          </h1>
        </div>

        {/* Responsive Navigation Menu */}
        <div className="mb-6">
          <nav className="bg-background border rounded-lg p-1">
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-1">
              {analyticsMenuItems.map((item) => {
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
                  {analyticsMenuItems.find(item => isActive(item.value)) && (
                    <>
                      {(() => {
                        const activeItem = analyticsMenuItems.find(item => isActive(item.value));
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
                      <span className="sr-only">Abrir menú de análisis</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64">
                    <div className="flex flex-col space-y-4 mt-4">
                      <div className="text-lg font-semibold">Análisis</div>
                      
                      <div className="space-y-2">
                        {analyticsMenuItems.map((item) => {
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
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
};

export default Dashboard;

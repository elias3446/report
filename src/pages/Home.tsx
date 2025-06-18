import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, FileText, LayoutDashboard, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
const Home = () => {
  const {
    user
  } = useAuth();
  return <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Bienvenido a GeoReport
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistema de gestión de reportes georreferenciados para mantener tu comunidad informada
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Map className="h-8 w-8 text-blue-600" />
                <CardTitle>Mapa de Reportes</CardTitle>
              </div>
              <CardDescription>
                Visualiza todos los reportes en un mapa interactivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/mapa-reportes">Ver Mapa</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-green-600" />
                <CardTitle>Reportes Públicos</CardTitle>
              </div>
              <CardDescription>
                Consulta la lista completa de reportes registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/reportes-publicos" className="my-[23px]">Ver Reportes</Link>
              </Button>
            </CardContent>
          </Card>

          {user && <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <LayoutDashboard className="h-8 w-8 text-purple-600" />
                  <CardTitle>Dashboard</CardTitle>
                </div>
                <CardDescription>
                  Panel principal para visualizar estadísticas y actividad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="secondary" className="w-full">
                  <Link to="/dashboard">Ir al Dashboard</Link>
                </Button>
              </CardContent>
            </Card>}
        </div>

        {/* Welcome Message for Authenticated Users */}
        {user && <div className="text-center">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <div className="flex items-center justify-center space-x-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-lg">Bienvenido</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground mb-4">
                  {user.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  Tienes acceso completo al sistema de administración
                </p>
              </CardContent>
            </Card>
          </div>}
      </div>
    </div>;
};
export default Home;
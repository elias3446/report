
import React from 'react';
import { EstadosManagement } from '@/components/estados/EstadosManagement';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const AdminEstados = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gestión de Estados</h1>
            <p className="text-muted-foreground">
              Administra los estados del sistema
            </p>
          </div>
        </div>
      </div>
      
      <EstadosManagement />
    </div>
  );
};

export default AdminEstados;

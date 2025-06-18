
import React from 'react';
import { RolesManagement } from '@/components/roles/RolesManagement';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const AdminRoles = () => {
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
            <h1 className="text-3xl font-bold">Gestión de Roles</h1>
            <p className="text-muted-foreground">
              Administra los roles y permisos del sistema
            </p>
          </div>
        </div>
      </div>
      
      <RolesManagement />
    </div>
  );
};

export default AdminRoles;

import React from 'react';
import { ReportesManagement } from '@/components/reportes/ReportesManagement';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
export const AdminReportes = () => {
  return <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        
      </div>
      
      <ReportesManagement />
    </div>;
};
export default AdminReportes;
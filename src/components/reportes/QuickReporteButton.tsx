
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const QuickReporteButton = () => {
  return (
    <Button asChild className="flex items-center space-x-2">
      <Link to="/nuevo-reporte">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Nuevo Reporte</span>
      </Link>
    </Button>
  );
};

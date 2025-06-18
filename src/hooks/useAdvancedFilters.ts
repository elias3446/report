
import { useState, useMemo } from 'react';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface AdvancedFilters {
  dateRange: DateRange | null;
  priority: string[];
  estados: string[];
  categorias: string[];
  searchTerm: string[];
  activeTab: 'busqueda' | 'fechas' | 'prioridad' | 'estados' | 'categorias' | 'estado_reporte';
}

const defaultFilters: AdvancedFilters = {
  dateRange: null,
  priority: [],
  estados: [],
  categorias: [],
  searchTerm: [],
  activeTab: 'busqueda',
};

export const useAdvancedFilters = () => {
  const [filters, setFilters] = useState<AdvancedFilters>(defaultFilters);

  const updateFilter = <K extends keyof AdvancedFilters>(
    key: K,
    value: AdvancedFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.dateRange !== null ||
      filters.priority.length > 0 ||
      filters.estados.length > 0 ||
      filters.categorias.length > 0 ||
      filters.searchTerm.length > 0
    );
  }, [filters]);

  // Validar si los filtros son válidos para comparación
  const isValidForComparison = useMemo(() => {
    switch (filters.activeTab) {
      case 'busqueda':
        return filters.searchTerm.length >= 2;
      case 'fechas':
        return filters.dateRange !== null;
      case 'prioridad':
        return filters.priority.length > 0;
      case 'estados':
        return filters.estados.length > 0;
      case 'categorias':
        return filters.categorias.length > 0;
      case 'estado_reporte':
        return filters.estados.length > 0;
      default:
        return false;
    }
  }, [filters]);

  return {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    isValidForComparison,
  };
};

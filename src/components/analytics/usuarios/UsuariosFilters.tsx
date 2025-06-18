
import React from 'react';
import { AdvancedFiltersPanel } from '../AdvancedFiltersPanel';
import type { AdvancedFilters } from '@/hooks/useAdvancedFilters';

interface UsuariosFiltersProps {
  filtersOpen: boolean;
  onToggle: () => void;
  onFiltersChange: (filters: AdvancedFilters) => void;
  onUserSelection: (userIds: string[]) => void;
  selectedUserIds: string[];
}

export const UsuariosFilters: React.FC<UsuariosFiltersProps> = ({
  filtersOpen,
  onToggle,
  onFiltersChange,
  onUserSelection,
  selectedUserIds
}) => {
  return (
    <AdvancedFiltersPanel
      isOpen={filtersOpen}
      onToggle={onToggle}
      onFiltersChange={onFiltersChange}
      onMultipleReportSelection={onUserSelection}
      selectedReportIds={selectedUserIds}
      context="usuarios"
    />
  );
};


import { useState } from 'react';
import { EstadosList } from './EstadosList';
import { EstadoForm } from './EstadoForm';
import { EstadoDetail } from './EstadoDetail';
import { BulkUploadEstados } from './BulkUploadEstados';
import { useEstados } from '@/hooks/useEstados';
import type { Estado } from '@/types/estados';

type ViewMode = 'list' | 'create' | 'edit' | 'detail' | 'bulk-upload';

export const EstadosManagement = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEstado, setSelectedEstado] = useState<Estado | null>(null);
  
  const { createEstado, updateEstado, isCreating, isUpdating } = useEstados();

  const handleCreateEstado = () => {
    setSelectedEstado(null);
    setViewMode('create');
  };

  const handleBulkUpload = () => {
    setViewMode('bulk-upload');
  };

  const handleEditEstado = (estado: Estado) => {
    setSelectedEstado(estado);
    setViewMode('edit');
  };

  const handleViewEstado = (estado: Estado) => {
    setSelectedEstado(estado);
    setViewMode('detail');
  };

  const handleFormSubmit = (data: any) => {
    if (viewMode === 'edit' && selectedEstado) {
      updateEstado({ id: selectedEstado.id, ...data });
    } else {
      createEstado(data);
    }
    setViewMode('list');
    setSelectedEstado(null);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedEstado(null);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedEstado(null);
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <EstadoForm
        estado={selectedEstado || undefined}
        onSubmit={handleFormSubmit}
        onCancel={handleCancel}
        isLoading={isCreating || isUpdating}
      />
    );
  }

  if (viewMode === 'detail' && selectedEstado) {
    return (
      <EstadoDetail
        estado={selectedEstado}
        onEdit={handleEditEstado}
        onBack={handleBackToList}
      />
    );
  }

  if (viewMode === 'bulk-upload') {
    return (
      <BulkUploadEstados onBack={handleBackToList} />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <EstadosList
        onCreateEstado={handleCreateEstado}
        onEditEstado={handleEditEstado}
        onViewEstado={handleViewEstado}
        onBulkUpload={handleBulkUpload}
      />
    </div>
  );
};

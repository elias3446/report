
import { useState } from 'react';
import { RolesList } from './RolesList';
import { RoleForm } from './RoleForm';
import { RoleDetail } from './RoleDetail';
import { BulkUploadRoles } from './BulkUploadRoles';
import { useRoles } from '@/hooks/useRoles';
import type { Role } from '@/types/roles';

type ViewMode = 'list' | 'create' | 'edit' | 'detail' | 'bulk-upload';

export const RolesManagement = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  const { createRole, updateRole, isCreating, isUpdating } = useRoles();

  const handleCreateRole = () => {
    setSelectedRole(null);
    setViewMode('create');
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setViewMode('edit');
  };

  const handleViewRole = (role: Role) => {
    setSelectedRole(role);
    setViewMode('detail');
  };

  const handleBulkUpload = () => {
    setViewMode('bulk-upload');
  };

  const handleFormSubmit = (data: any) => {
    if (viewMode === 'edit' && selectedRole) {
      updateRole(data);
    } else {
      createRole(data);
    }
    setViewMode('list');
    setSelectedRole(null);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedRole(null);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedRole(null);
  };

  if (viewMode === 'bulk-upload') {
    return (
      <BulkUploadRoles onBack={handleBackToList} />
    );
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <RoleForm
        role={selectedRole || undefined}
        onSubmit={handleFormSubmit}
        onCancel={handleCancel}
        isLoading={isCreating || isUpdating}
      />
    );
  }

  if (viewMode === 'detail' && selectedRole) {
    return (
      <RoleDetail
        role={selectedRole}
        onEdit={handleEditRole}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <RolesList
        onCreateRole={handleCreateRole}
        onEditRole={handleEditRole}
        onViewRole={handleViewRole}
        onBulkUpload={handleBulkUpload}
      />
    </div>
  );
};

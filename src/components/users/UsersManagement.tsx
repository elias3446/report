
import { useState } from 'react';
import { UsersList } from './UsersList';
import { UserForm } from './UserForm';
import { UserDetail } from './UserDetail';
import { BulkUploadUsers } from './BulkUploadUsers';
import { useUsers, type User } from '@/hooks/useUsers';

type ViewMode = 'list' | 'create' | 'edit' | 'detail' | 'bulk-upload';

export const UsersManagement = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const { createUser, updateUser, isCreating, isUpdating } = useUsers();

  const handleCreateUser = () => {
    setSelectedUser(null);
    setViewMode('create');
  };

  const handleBulkUpload = () => {
    setViewMode('bulk-upload');
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setViewMode('edit');
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewMode('detail');
  };

  const handleFormSubmit = (data: any) => {
    if (viewMode === 'edit' && selectedUser) {
      updateUser(data);
    } else {
      createUser(data);
    }
    setViewMode('list');
    setSelectedUser(null);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedUser(null);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedUser(null);
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <UserForm
        user={selectedUser || undefined}
        onSubmit={handleFormSubmit}
        onCancel={handleCancel}
        isLoading={isCreating || isUpdating}
      />
    );
  }

  if (viewMode === 'detail' && selectedUser) {
    return (
      <UserDetail
        user={selectedUser}
        onEdit={handleEditUser}
        onBack={handleBackToList}
      />
    );
  }

  if (viewMode === 'bulk-upload') {
    return (
      <BulkUploadUsers onBack={handleBackToList} />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <UsersList
        onCreateUser={handleCreateUser}
        onEditUser={handleEditUser}
        onViewUser={handleViewUser}
        onBulkUpload={handleBulkUpload}
      />
    </div>
  );
};

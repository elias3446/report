
import { useState } from 'react';
import { CategoriesList } from './CategoriesList';
import { CategoryForm } from './CategoryForm';
import { CategoryDetail } from './CategoryDetail';
import { BulkUploadCategories } from './BulkUploadCategories';
import { useCategories } from '@/hooks/useCategories';
import type { Category } from '@/types/categories';

type ViewMode = 'list' | 'create' | 'edit' | 'detail' | 'bulk-upload';

export const CategoriesManagement = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  const { createCategory, updateCategory, isCreating, isUpdating } = useCategories();

  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setViewMode('create');
  };

  const handleBulkUpload = () => {
    setViewMode('bulk-upload');
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setViewMode('edit');
  };

  const handleViewCategory = (category: Category) => {
    setSelectedCategory(category);
    setViewMode('detail');
  };

  const handleFormSubmit = (data: any) => {
    if (viewMode === 'edit' && selectedCategory) {
      updateCategory({ id: selectedCategory.id, ...data });
    } else {
      createCategory(data);
    }
    setViewMode('list');
    setSelectedCategory(null);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedCategory(null);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedCategory(null);
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <CategoryForm
        category={selectedCategory || undefined}
        onSubmit={handleFormSubmit}
        onCancel={handleCancel}
        isLoading={isCreating || isUpdating}
      />
    );
  }

  if (viewMode === 'detail' && selectedCategory) {
    return (
      <CategoryDetail
        category={selectedCategory}
        onEdit={handleEditCategory}
        onBack={handleBackToList}
      />
    );
  }

  if (viewMode === 'bulk-upload') {
    return (
      <BulkUploadCategories onBack={handleBackToList} />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <CategoriesList
        onCreateCategory={handleCreateCategory}
        onEditCategory={handleEditCategory}
        onViewCategory={handleViewCategory}
        onBulkUpload={handleBulkUpload}
      />
    </div>
  );
};

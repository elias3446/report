
import { useState, useCallback, useMemo } from 'react';

export interface BulkSelectionHook<T> {
  selectedItems: Set<string>;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  handleSelectAll: () => void;
  handleSelectItem: (id: string) => void;
  clearSelection: () => void;
  getSelectedData: () => T[];
  selectedCount: number;
}

export const useBulkSelection = <T extends { id: string }>(
  items: T[]
): BulkSelectionHook<T> => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const isAllSelected = useMemo(
    () => items.length > 0 && selectedItems.size === items.length,
    [items.length, selectedItems.size]
  );

  const isIndeterminate = useMemo(
    () => selectedItems.size > 0 && selectedItems.size < items.length,
    [items.length, selectedItems.size]
  );

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  }, [isAllSelected, items]);

  const handleSelectItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const getSelectedData = useCallback(() => {
    return items.filter(item => selectedItems.has(item.id));
  }, [items, selectedItems]);

  return {
    selectedItems,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    handleSelectItem,
    clearSelection,
    getSelectedData,
    selectedCount: selectedItems.size,
  };
};

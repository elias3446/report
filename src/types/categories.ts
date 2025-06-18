
export interface Category {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  color: string;
  icono: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateCategoryData {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  color?: string;
  icono?: string;
}

export interface UpdateCategoryData extends CreateCategoryData {
  id: string;
}

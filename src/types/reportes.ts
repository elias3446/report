
export interface Reporte {
  id: string;
  nombre: string;
  descripcion: string;
  categoria_id: string;
  estado_id: string;
  created_by: string;
  assigned_to: string | null;
  activo: boolean | null; // Cambiado para permitir null
  longitud: number | null;
  latitud: number | null;
  direccion: string | null;
  referencia_direccion: string | null;
  imagenes: string[];
  priority: 'alto' | 'medio' | 'bajo' | 'urgente';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Datos relacionados
  categoria?: {
    id: string;
    nombre: string;
    descripcion?: string;
    color: string;
    icono: string;
    deleted_at: string | null;
  };
  estado?: {
    id: string;
    nombre: string;
    descripcion?: string;
    color: string;
    icono: string;
    deleted_at: string | null;
  };
  created_by_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  assigned_to_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export interface CreateReporteData {
  nombre: string;
  descripcion: string;
  categoria_id: string;
  estado_id: string;
  assigned_to?: string;
  longitud?: number;
  latitud?: number;
  direccion?: string;
  referencia_direccion?: string;
  imagenes?: string[];
  priority?: 'alto' | 'medio' | 'bajo' | 'urgente';
}

export interface UpdateReporteData extends Partial<CreateReporteData> {
  id: string;
  activo?: boolean;
}

export interface ReporteHistorial {
  id: string;
  reporte_id: string;
  assigned_from: string | null;
  assigned_to: string | null;
  assigned_by: string;
  comentario: string | null;
  fecha_asignacion: string;
  // Datos relacionados
  assigned_from_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  assigned_to_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  assigned_by_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

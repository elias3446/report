
export type PermissionEnum = 
  | 'ver_reporte'
  | 'crear_reporte' 
  | 'editar_reporte'
  | 'eliminar_reporte'
  | 'ver_usuario'
  | 'crear_usuario'
  | 'editar_usuario' 
  | 'eliminar_usuario'
  | 'ver_categoria'
  | 'crear_categoria'
  | 'editar_categoria'
  | 'eliminar_categoria'
  | 'ver_estado'
  | 'crear_estado'
  | 'editar_estado'
  | 'eliminar_estado'
  | 'ver_rol'
  | 'crear_rol'
  | 'editar_rol'
  | 'eliminar_rol';

export interface Role {
  id: string;
  nombre: string;
  descripcion: string;
  permisos: PermissionEnum[];
  activo: boolean;
  color: string;
  icono: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateRoleData {
  nombre: string;
  descripcion: string;
  permisos: PermissionEnum[];
  activo?: boolean;
  color?: string;
  icono?: string;
}

export interface UpdateRoleData extends Partial<CreateRoleData> {
  id: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string;
  assigned_at: string;
}

export const PERMISSION_LABELS: Record<PermissionEnum, string> = {
  'ver_reporte': 'Ver Reportes',
  'crear_reporte': 'Crear Reportes',
  'editar_reporte': 'Editar Reportes',
  'eliminar_reporte': 'Eliminar Reportes',
  'ver_usuario': 'Ver Usuarios',
  'crear_usuario': 'Crear Usuarios',
  'editar_usuario': 'Editar Usuarios',
  'eliminar_usuario': 'Eliminar Usuarios',
  'ver_categoria': 'Ver Categorías',
  'crear_categoria': 'Crear Categorías',
  'editar_categoria': 'Editar Categorías',
  'eliminar_categoria': 'Eliminar Categorías',
  'ver_estado': 'Ver Estados',
  'crear_estado': 'Crear Estados',
  'editar_estado': 'Editar Estados',
  'eliminar_estado': 'Eliminar Estados',
  'ver_rol': 'Ver Roles',
  'crear_rol': 'Crear Roles',
  'editar_rol': 'Editar Roles',
  'eliminar_rol': 'Eliminar Roles'
};

export const PERMISSION_GROUPS = {
  'Reportes': ['ver_reporte', 'crear_reporte', 'editar_reporte', 'eliminar_reporte'],
  'Usuarios': ['ver_usuario', 'crear_usuario', 'editar_usuario', 'eliminar_usuario'],
  'Categorías': ['ver_categoria', 'crear_categoria', 'editar_categoria', 'eliminar_categoria'],
  'Estados': ['ver_estado', 'crear_estado', 'editar_estado', 'eliminar_estado'],
  'Roles': ['ver_rol', 'crear_rol', 'editar_rol', 'eliminar_rol']
} as const;

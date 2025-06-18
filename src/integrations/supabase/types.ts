export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      actividades: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          descripcion: string
          id: string
          ip_address: unknown | null
          metadatos: Json | null
          registro_id: string | null
          tabla_afectada: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          descripcion: string
          id?: string
          ip_address?: unknown | null
          metadatos?: Json | null
          registro_id?: string | null
          tabla_afectada?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          descripcion?: string
          id?: string
          ip_address?: unknown | null
          metadatos?: Json | null
          registro_id?: string | null
          tabla_afectada?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "actividades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cambios_historial: {
        Row: {
          actividad_id: string
          campos_modificados: string[] | null
          created_at: string
          descripcion_cambio: string | null
          id: string
          operation_type: Database["public"]["Enums"]["operation_type"]
          registro_id: string
          tabla_nombre: string
          user_id: string
          valores_anteriores: Json | null
          valores_nuevos: Json | null
        }
        Insert: {
          actividad_id: string
          campos_modificados?: string[] | null
          created_at?: string
          descripcion_cambio?: string | null
          id?: string
          operation_type: Database["public"]["Enums"]["operation_type"]
          registro_id: string
          tabla_nombre: string
          user_id: string
          valores_anteriores?: Json | null
          valores_nuevos?: Json | null
        }
        Update: {
          actividad_id?: string
          campos_modificados?: string[] | null
          created_at?: string
          descripcion_cambio?: string | null
          id?: string
          operation_type?: Database["public"]["Enums"]["operation_type"]
          registro_id?: string
          tabla_nombre?: string
          user_id?: string
          valores_anteriores?: Json | null
          valores_nuevos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cambios_historial_actividad_id_fkey"
            columns: ["actividad_id"]
            isOneToOne: false
            referencedRelation: "actividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cambios_historial_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          activo: boolean
          color: string
          created_at: string
          created_by: string
          deleted_at: string | null
          descripcion: string | null
          icono: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          color?: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          descripcion?: string | null
          icono?: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          color?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          descripcion?: string | null
          icono?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      estados: {
        Row: {
          activo: boolean
          color: string
          created_at: string
          created_by: string
          deleted_at: string | null
          descripcion: string
          icono: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          color?: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          descripcion: string
          icono?: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          color?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          descripcion?: string
          icono?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estados_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          auto_delete_read: boolean
          created_at: string
          enabled: boolean
          id: string
          retention_days: number
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_delete_read?: boolean
          created_at?: string
          enabled?: boolean
          id?: string
          retention_days?: number
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_delete_read?: boolean
          created_at?: string
          enabled?: boolean
          id?: string
          retention_days?: number
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          asset: boolean | null
          avatar: string | null
          confirmed: boolean | null
          created_at: string
          deleted_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: string[]
          updated_at: string
        }
        Insert: {
          asset?: boolean | null
          avatar?: string | null
          confirmed?: boolean | null
          created_at?: string
          deleted_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string[]
          updated_at?: string
        }
        Update: {
          asset?: boolean | null
          avatar?: string | null
          confirmed?: boolean | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      reporte_historial: {
        Row: {
          assigned_by: string
          assigned_from: string | null
          assigned_to: string | null
          comentario: string | null
          fecha_asignacion: string
          id: string
          reporte_id: string
        }
        Insert: {
          assigned_by: string
          assigned_from?: string | null
          assigned_to?: string | null
          comentario?: string | null
          fecha_asignacion?: string
          id?: string
          reporte_id: string
        }
        Update: {
          assigned_by?: string
          assigned_from?: string | null
          assigned_to?: string | null
          comentario?: string | null
          fecha_asignacion?: string
          id?: string
          reporte_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reporte_historial_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporte_historial_assigned_from_fkey"
            columns: ["assigned_from"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporte_historial_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporte_historial_reporte_id_fkey"
            columns: ["reporte_id"]
            isOneToOne: false
            referencedRelation: "reportes"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes: {
        Row: {
          activo: boolean | null
          assigned_to: string | null
          categoria_id: string
          created_at: string
          created_by: string
          deleted_at: string | null
          descripcion: string
          direccion: string | null
          estado_id: string
          id: string
          imagenes: string[] | null
          latitud: number | null
          longitud: number | null
          nombre: string
          priority: Database["public"]["Enums"]["priority_enum"]
          referencia_direccion: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          assigned_to?: string | null
          categoria_id: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          descripcion: string
          direccion?: string | null
          estado_id: string
          id?: string
          imagenes?: string[] | null
          latitud?: number | null
          longitud?: number | null
          nombre: string
          priority?: Database["public"]["Enums"]["priority_enum"]
          referencia_direccion?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          assigned_to?: string | null
          categoria_id?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          descripcion?: string
          direccion?: string | null
          estado_id?: string
          id?: string
          imagenes?: string[] | null
          latitud?: number | null
          longitud?: number | null
          nombre?: string
          priority?: Database["public"]["Enums"]["priority_enum"]
          referencia_direccion?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reportes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          activo: boolean
          color: string
          created_at: string
          created_by: string
          deleted_at: string | null
          descripcion: string
          icono: string
          id: string
          nombre: string
          permisos: Database["public"]["Enums"]["permission_enum"][]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          color?: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          descripcion: string
          icono?: string
          id?: string
          nombre: string
          permisos?: Database["public"]["Enums"]["permission_enum"][]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          color?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          descripcion?: string
          icono?: string
          id?: string
          nombre?: string
          permisos?: Database["public"]["Enums"]["permission_enum"][]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string
          deleted_at: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          deleted_at?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          deleted_at?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_title: string
          p_message: string
          p_data?: Json
        }
        Returns: string
      }
      get_change_history: {
        Args: {
          p_tabla_nombre?: string
          p_registro_id?: string
          p_user_id?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          tabla_nombre: string
          registro_id: string
          operation_type: Database["public"]["Enums"]["operation_type"]
          valores_anteriores: Json
          valores_nuevos: Json
          campos_modificados: string[]
          descripcion_cambio: string
          created_at: string
          user_email: string
        }[]
      }
      get_user_activities: {
        Args: { p_user_id?: string; p_limit?: number; p_offset?: number }
        Returns: {
          id: string
          activity_type: Database["public"]["Enums"]["activity_type"]
          descripcion: string
          tabla_afectada: string
          registro_id: string
          metadatos: Json
          created_at: string
          user_email: string
        }[]
      }
      has_users: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_data_export: {
        Args: {
          p_table_name: string
          p_records_count: number
          p_export_format?: string
          p_metadata?: Json
        }
        Returns: string
      }
      log_data_import: {
        Args: {
          p_table_name: string
          p_records_count: number
          p_metadata?: Json
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_event_type: string
          p_description: string
          p_user_id?: string
          p_metadata?: Json
        }
        Returns: string
      }
      log_user_login: {
        Args: { p_user_id: string; p_metadata?: Json }
        Returns: string
      }
      log_user_logout: {
        Args: { p_user_id: string; p_metadata?: Json }
        Returns: string
      }
      notify_deletion: {
        Args: {
          p_table_name: string
          p_record_name: string
          p_deleted_by_user_id: string
        }
        Returns: undefined
      }
      registrar_actividad: {
        Args: {
          p_activity_type: Database["public"]["Enums"]["activity_type"]
          p_descripcion: string
          p_tabla_afectada?: string
          p_registro_id?: string
          p_metadatos?: Json
        }
        Returns: string
      }
      system_has_users: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_has_role_permission: {
        Args: {
          permission_name: Database["public"]["Enums"]["permission_enum"]
        }
        Returns: boolean
      }
      validate_file_upload: {
        Args:
          | { p_filename: string; p_file_size: number; p_content_type: string }
          | { p_filename: string; p_file_size: number; p_content_type: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_type:
        | "CREATE"
        | "READ"
        | "UPDATE"
        | "DELETE"
        | "LOGIN"
        | "LOGOUT"
        | "SEARCH"
        | "EXPORT"
        | "IMPORT"
      notification_type:
        | "reporte_asignado"
        | "reporte_reasignado"
        | "reporte_desasignado"
        | "perfil_actualizado"
        | "reporte_eliminado"
        | "usuario_eliminado"
        | "rol_eliminado"
        | "categoria_eliminada"
        | "estado_eliminado"
      operation_type: "INSERT" | "UPDATE" | "DELETE" | "SELECT"
      permission_enum:
        | "ver_reporte"
        | "crear_reporte"
        | "editar_reporte"
        | "eliminar_reporte"
        | "ver_usuario"
        | "crear_usuario"
        | "editar_usuario"
        | "eliminar_usuario"
        | "ver_categoria"
        | "crear_categoria"
        | "editar_categoria"
        | "eliminar_categoria"
        | "ver_estado"
        | "crear_estado"
        | "editar_estado"
        | "eliminar_estado"
        | "ver_rol"
        | "crear_rol"
        | "editar_rol"
        | "eliminar_rol"
      priority_enum: "alto" | "medio" | "bajo" | "urgente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "CREATE",
        "READ",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "SEARCH",
        "EXPORT",
        "IMPORT",
      ],
      notification_type: [
        "reporte_asignado",
        "reporte_reasignado",
        "reporte_desasignado",
        "perfil_actualizado",
        "reporte_eliminado",
        "usuario_eliminado",
        "rol_eliminado",
        "categoria_eliminada",
        "estado_eliminado",
      ],
      operation_type: ["INSERT", "UPDATE", "DELETE", "SELECT"],
      permission_enum: [
        "ver_reporte",
        "crear_reporte",
        "editar_reporte",
        "eliminar_reporte",
        "ver_usuario",
        "crear_usuario",
        "editar_usuario",
        "eliminar_usuario",
        "ver_categoria",
        "crear_categoria",
        "editar_categoria",
        "eliminar_categoria",
        "ver_estado",
        "crear_estado",
        "editar_estado",
        "eliminar_estado",
        "ver_rol",
        "crear_rol",
        "editar_rol",
        "eliminar_rol",
      ],
      priority_enum: ["alto", "medio", "bajo", "urgente"],
    },
  },
} as const

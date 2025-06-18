
import type { Database } from '@/integrations/supabase/types';

export type Estado = Database['public']['Tables']['estados']['Row'];
export type CreateEstadoData = Database['public']['Tables']['estados']['Insert'];
export type UpdateEstadoData = Database['public']['Tables']['estados']['Update'];

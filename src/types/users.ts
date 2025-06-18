
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  confirmed?: boolean;
  created_at: string;
  updated_at: string;
  role?: string[];
  asset?: boolean;
}

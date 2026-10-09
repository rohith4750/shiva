export interface User {
  id: string | number;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  password?: string;
  newpassword?: string | null;
  role: string;
  role_id?: number | null;
  permissions?: string[];
  department?: string;
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface AuthSession {
  id: string | number;
  name: string;
  email: string;
  role: string;
  role_id?: number | null;
  permissions?: string[];
}

export interface Permission {
  id: number;
  name: string;
  description?: string | null;
  roles?: string[];
}

export interface Role {
  id: number;
  name: string;
  description?: string | null;
  user_count?: number;
  permissions: Permission[];
}

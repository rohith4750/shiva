export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  newpassword: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  id: number;
  name: string;
  email: string;
  role: string;
}

export type UserRole = 'citizen' | 'mp' | 'admin';

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  name?: string;
  wilayaId?: string;
  image?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

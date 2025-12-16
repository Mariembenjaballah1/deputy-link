export type UserRole = 'citizen' | 'mp' | 'local_deputy' | 'admin';

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  name?: string;
  wilayaId?: string;
  dairaId?: string;
  image?: string;
  email?: string;
  bio?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, AuthState } from '@/types/auth';

interface AuthStore extends AuthState {
  login: (phone: string, role: UserRole) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

// Mock users for demo
const mockUsers: Record<string, User> = {
  '12345678': { id: '1', phone: '12345678', role: 'citizen', name: 'مواطن', wilayaId: '1' },
  '11111111': { id: '2', phone: '11111111', role: 'mp', name: 'محمد بن علي', wilayaId: '1', image: 'https://randomuser.me/api/portraits/men/1.jpg' },
  '00000000': { id: '3', phone: '00000000', role: 'admin', name: 'مدير النظام' },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: (phone: string, role: UserRole) => {
        const user = mockUsers[phone] || {
          id: Date.now().toString(),
          phone,
          role,
          name: role === 'citizen' ? 'مواطن' : role === 'mp' ? 'نائب' : 'مدير',
        };
        set({ user, isAuthenticated: true, isLoading: false });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, AuthState } from '@/types/auth';

interface AuthStore extends AuthState {
  login: (phone: string, role: UserRole, name?: string, image?: string, wilayaId?: string, dairaId?: string, id?: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  updateWilaya: (wilayaId: string, dairaId?: string) => void;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'email' | 'bio' | 'image'>>) => void;
}

// Mock users for demo
const mockUsers: Record<string, User> = {
  '12345678': { id: '1', phone: '12345678', role: 'citizen', name: 'مواطن', wilayaId: '1', dairaId: '1' },
  '11111111': { id: '2', phone: '11111111', role: 'mp', name: 'محمد بن علي', wilayaId: '1', dairaId: '1', image: 'https://randomuser.me/api/portraits/men/1.jpg', email: 'mp@assembly.tn' },
  '22222222': { id: '4', phone: '22222222', role: 'local_deputy', name: 'أحمد الهادي', wilayaId: '1', dairaId: '1', image: 'https://randomuser.me/api/portraits/men/3.jpg', email: 'deputy@municipality.tn' },
  '00000000': { id: '3', phone: '00000000', role: 'admin', name: 'مدير النظام' },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: (phone: string, role: UserRole, name?: string, image?: string, wilayaId?: string, dairaId?: string, id?: string) => {
        const defaultName = role === 'citizen' ? 'مواطن' : role === 'mp' ? 'نائب الشعب' : role === 'local_deputy' ? 'نائب الجهة' : 'مدير';
        const user: User = mockUsers[phone] || {
          id: id || Date.now().toString(),
          phone,
          role,
          name: name || defaultName,
          image: image || undefined,
          wilayaId: wilayaId || undefined,
          dairaId: dairaId || undefined,
        };
        set({ user, isAuthenticated: true, isLoading: false });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },
      updateWilaya: (wilayaId: string, dairaId?: string) => {
        set((state) => ({
          user: state.user ? { ...state.user, wilayaId, dairaId } : null,
        }));
      },
      updateProfile: (updates: Partial<Pick<User, 'name' | 'email' | 'bio' | 'image'>>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

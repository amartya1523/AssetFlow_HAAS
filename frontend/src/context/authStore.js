import { create } from 'zustand';
import { authAPI } from '../api/auth';

/**
 * Auth store backed by localStorage for persistence across refreshes.
 * On app load the store calls /auth/me to revalidate the token.
 */
const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('af_user') || 'null'),
  token: localStorage.getItem('af_token') || null,
  isLoading: false,
  isInitialized: false,

  setAuth: (user, token) => {
    localStorage.setItem('af_token', token);
    localStorage.setItem('af_user', JSON.stringify(user));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('af_token');
    localStorage.removeItem('af_user');
    set({ user: null, token: null });
  },

  /**
   * Revalidate: call GET /auth/me to check if stored token is still valid.
   * Called once on app boot.
   */
  revalidate: async () => {
    const token = get().token;
    if (!token) {
      set({ isInitialized: true });
      return;
    }
    set({ isLoading: true });
    try {
      const res = await authAPI.getMe();
      const user = res.data.data;
      localStorage.setItem('af_user', JSON.stringify(user));
      set({ user, token, isInitialized: true, isLoading: false });
    } catch {
      // Token invalid — clear everything
      localStorage.removeItem('af_token');
      localStorage.removeItem('af_user');
      set({ user: null, token: null, isInitialized: true, isLoading: false });
    }
  },
}));

export default useAuthStore;

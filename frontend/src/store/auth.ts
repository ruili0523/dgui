import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: number
  username: string
  is_admin: boolean
}

interface AuthState {
  token: string | null
  user: User | null
  expiresAt: number | null
  isAuthenticated: boolean
  login: (token: string, user: User, expiresAt: number) => void
  logout: () => void
  checkAuth: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      expiresAt: null,
      isAuthenticated: false,

      login: (token, user, expiresAt) => {
        set({
          token,
          user,
          expiresAt,
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({
          token: null,
          user: null,
          expiresAt: null,
          isAuthenticated: false,
        })
      },

      checkAuth: () => {
        const { token, expiresAt } = get()
        if (!token || !expiresAt) {
          return false
        }
        // 检查 token 是否过期
        if (Date.now() / 1000 > expiresAt) {
          get().logout()
          return false
        }
        return true
      },
    }),
    {
      name: 'dgui-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, Session } from '@supabase/supabase-js'

type UserStoreState = {
  user: User | null
  session: Session | null
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  clearAuth: () => void
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      clearAuth: () => set({ user: null, session: null })
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist session token info, not the whole user object if we don't want to
      // But persisting user info is usually fine for faster initial paint
      partialize: (state) => ({
        session: state.session
      })
    }
  )
)

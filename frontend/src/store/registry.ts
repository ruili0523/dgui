import { create } from 'zustand'
import type { Registry } from '@/lib/api'

interface RegistryStore {
  activeRegistry: Registry | null
  setActiveRegistry: (registry: Registry | null) => void
}

export const useRegistryStore = create<RegistryStore>((set) => ({
  activeRegistry: null,
  setActiveRegistry: (registry) => set({ activeRegistry: registry }),
}))

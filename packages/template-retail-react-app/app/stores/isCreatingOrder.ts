import {create} from 'zustand'

interface IsCreatingOrderStore {
    isCreatingOrder: boolean
    setIsCreatingOrder: (isCreatingOrder: boolean) => void
}

export const useCreateOrderStore = create<IsCreatingOrderStore>((set) => ({
    isCreatingOrder: false,
    setIsCreatingOrder: (isCreatingOrder) => set({isCreatingOrder})
}))
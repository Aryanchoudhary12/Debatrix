import { create } from "zustand";

interface RoastStore {
    roastId: string | null;
    setRoastId: (id: string | null) => void;
}
export const useRoastStore = create<RoastStore>()((set) => ({
    roastId: null,
    setRoastId: (id) => set({ roastId: id }),
}));

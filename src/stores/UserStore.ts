import { create } from "zustand";

export type User = {
  uid: string;
};

type UserStore = {
  user: User | null;
  setUser: (user: User | null) => void;
};

const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

export default useUserStore;

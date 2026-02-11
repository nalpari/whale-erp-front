import { create } from 'zustand';

interface MyPageStore {
  isOpen: boolean;
  activeTab: number;
  openMyPage: (tabIndex?: number) => void;
  closeMyPage: () => void;
  setActiveTab: (tabIndex: number) => void;
}

export const useMyPageStore = create<MyPageStore>((set) => ({
  isOpen: false,
  activeTab: 0,
  openMyPage: (tabIndex = 0) => set({ isOpen: true, activeTab: tabIndex }),
  closeMyPage: () => set({ isOpen: false, activeTab: 0 }),
  setActiveTab: (tabIndex) => set({ activeTab: tabIndex }),
}));

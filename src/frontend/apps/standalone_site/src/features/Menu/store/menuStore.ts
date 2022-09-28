import create from 'zustand';

interface UseMenu {
  isMenuOpen: boolean;
  switchMenuOpen: () => void;
}

export const useMenu = create<UseMenu>((set) => ({
  isMenuOpen: true,
  switchMenuOpen: () =>
    set((state: { isMenuOpen: boolean }) => ({
      isMenuOpen: !state.isMenuOpen,
    })),
}));

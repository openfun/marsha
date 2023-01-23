import { create } from 'zustand';

interface UseMenu {
  isDesktopMenuOpen: boolean;
  isMobileMenuOpen: boolean;
  isMenuOpen: (isDesktop: boolean) => boolean;
  switchMenuOpen: () => void;
}

export const useMenu = create<UseMenu>((set, get) => ({
  isDesktopMenuOpen: true,
  isMobileMenuOpen: false,
  isMenuOpen: (isDesktop: boolean) =>
    isDesktop ? get().isDesktopMenuOpen : get().isMobileMenuOpen,
  switchMenuOpen: () => {
    set((state: { isDesktopMenuOpen: boolean; isMobileMenuOpen: boolean }) => ({
      isDesktopMenuOpen: !state.isDesktopMenuOpen,
      isMobileMenuOpen: !state.isMobileMenuOpen,
    }));
  },
}));

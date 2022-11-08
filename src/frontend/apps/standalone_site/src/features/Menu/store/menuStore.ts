import create from 'zustand';

interface UseMenu {
  isDesktopMenuOpen: boolean;
  isMobileMenuOpen: boolean;
  isMenuOpen: (breakpoint: string) => boolean;
  switchMenuOpen: () => void;
}

export const useMenu = create<UseMenu>((set, get) => ({
  isDesktopMenuOpen: true,
  isMobileMenuOpen: false,
  isMenuOpen: (breakpoint: string) =>
    breakpoint === 'small' ? get().isMobileMenuOpen : get().isDesktopMenuOpen,
  switchMenuOpen: () => {
    set((state: { isDesktopMenuOpen: boolean; isMobileMenuOpen: boolean }) => ({
      isDesktopMenuOpen: !state.isDesktopMenuOpen,
      isMobileMenuOpen: !state.isMobileMenuOpen,
    }));
  },
}));

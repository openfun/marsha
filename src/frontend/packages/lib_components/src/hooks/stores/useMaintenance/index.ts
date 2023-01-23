import { create } from 'zustand';

interface MaintenantState {
  isActive: boolean;
}

export const useMaintenance = create<MaintenantState>(() => ({
  isActive: false,
}));

import { create } from 'zustand';

interface AttendanceStore {
  delay: number;
  setDelay: (newDelay: number) => void;
}

export const useAttendance = create<AttendanceStore>((set) => ({
  delay: 10000,
  setDelay: (newDelay: number) =>
    set((state) => ({ ...state, delay: newDelay })),
}));

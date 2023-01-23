import { create } from 'zustand';

interface SessionState {
  sessionId: string;
}

export const useCurrentSession = create<SessionState>(() => ({
  sessionId: '',
}));

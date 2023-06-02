import { init, configureScope } from '@sentry/browser';
import { create } from 'zustand';

interface SentryStore {
  isSentryReady: boolean;
  setSentry: (
    sentry_dsn: string,
    environment: string,
    release: string,
    application: string,
  ) => void;
}

export const useSentry = create<SentryStore>((set) => ({
  isSentryReady: false,
  setSentry: (
    dsn: string,
    environment: string,
    release: string,
    application: string,
  ) => {
    init({
      dsn,
      environment,
      release,
    });

    configureScope((scope) => scope.setExtra('application', application));

    set((state) => ({ ...state, isSentryReady: true }));
  },
}));

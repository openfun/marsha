import { createStore } from 'utils/createContext';

const store = createStore<boolean>('useLiveFeedback');

export const LiveFeedbackProvider = store.Provider;
export const useLiveFeedback = store.useStore;

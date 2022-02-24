import { createStore } from 'utils/createContext';

const store = createStore<boolean>();

export const StopLiveConfirmationProvider = store.Provider;
export const useStopLiveConfirmation = store.useStore;

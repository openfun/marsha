import { createStore } from 'utils/createContext';

const store = createStore<boolean>('useSetDisplayName');

export const SetDisplayNameProvider = store.Provider;
export const useSetDisplayName = store.useStore;

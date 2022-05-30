import { createStore } from 'utils/createContext';

interface SharingDocState {
  page: number;
  imageUrl: string;
}

const store = createStore<SharingDocState>();

export const SharedMediaCurrentPageProvider = store.Provider;
export const useSharedMediaCurrentPage = store.useStore;

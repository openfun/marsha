import { createStore } from 'utils/createContext';

interface SharingDocState {
  page: number;
  imageUrl: string;
}

const store = createStore<SharingDocState>('SharedMediaCurrentPageProvider');

export const SharedMediaCurrentPageProvider = store.Provider;
export const useSharedMediaCurrentPage = store.useStore;

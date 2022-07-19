import { SharedLiveMedia } from 'types/tracks';
import { createStore } from 'utils/createContext';
import { Nullable } from 'utils/types';

const store = createStore<Nullable<SharedLiveMedia>>(
  'DeleteSharedLiveMediaModalProvider',
);

export const DeleteSharedLiveMediaModalProvider = store.Provider;
export const useDeleteSharedLiveMediaModal = store.useStore;

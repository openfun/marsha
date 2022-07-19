import { SharedLiveMedia } from 'types/tracks';
import { createStore } from 'utils/createContext';
import { Nullable } from 'utils/types';

const store = createStore<Nullable<SharedLiveMedia>>(
  'DeleteSharedLiveMediaUploadModalProvider',
);

export const DeleteSharedLiveMediaUploadModalProvider = store.Provider;
export const useDeleteSharedLiveMediaUploadModal = store.useStore;

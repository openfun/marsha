import { Nullable } from 'lib-common';

import { SharedLiveMedia } from 'types/tracks';
import { createStore } from 'utils/createContext';

const store = createStore<Nullable<SharedLiveMedia>>(
  'DeleteSharedLiveMediaModalProvider',
);

export const DeleteSharedLiveMediaModalProvider = store.Provider;
export const useDeleteSharedLiveMediaModal = store.useStore;

import { Nullable } from 'lib-common';
import { createStore } from 'lib-components';

import { SharedLiveMedia } from 'types/tracks';

const store = createStore<Nullable<SharedLiveMedia>>(
  'DeleteSharedLiveMediaModalProvider',
);

export const DeleteSharedLiveMediaModalProvider = store.Provider;
export const useDeleteSharedLiveMediaModal = store.useStore;

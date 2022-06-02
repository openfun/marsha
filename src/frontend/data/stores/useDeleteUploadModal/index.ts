import { SharedLiveMedia } from 'types/tracks';
import { createStore } from 'utils/createContext';
import { Nullable } from 'utils/types';

const store = createStore<Nullable<SharedLiveMedia>>();

export const DeleteUploadModalProvider = store.Provider;
export const useDeleteUploadModal = store.useStore;

import { TimedText } from 'types/tracks';
import { createStore } from 'utils/createContext';
import { Nullable } from 'utils/types';

const store = createStore<Nullable<TimedText>>(
  'DeleteTimedTextTrackUploadModalProvider',
);

export const DeleteTimedTextTrackUploadModalProvider = store.Provider;
export const useDeleteTimedTextTrackUploadModal = store.useStore;

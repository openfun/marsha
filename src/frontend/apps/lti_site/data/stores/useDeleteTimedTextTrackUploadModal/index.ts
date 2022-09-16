import { Nullable } from 'lib-common';

import { TimedText } from 'types/tracks';
import { createStore } from 'utils/createContext';

const store = createStore<Nullable<TimedText>>(
  'DeleteTimedTextTrackUploadModalProvider',
);

export const DeleteTimedTextTrackUploadModalProvider = store.Provider;
export const useDeleteTimedTextTrackUploadModal = store.useStore;

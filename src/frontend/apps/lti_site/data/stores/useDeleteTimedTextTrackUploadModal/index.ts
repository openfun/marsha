import { Nullable } from 'lib-common';
import { createStore } from 'lib-components';

import { TimedText } from 'types/tracks';

const store = createStore<Nullable<TimedText>>(
  'DeleteTimedTextTrackUploadModalProvider',
);

export const DeleteTimedTextTrackUploadModalProvider = store.Provider;
export const useDeleteTimedTextTrackUploadModal = store.useStore;

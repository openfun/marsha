import { createStore } from 'lib-components';

interface PictureInPictureState {
  reversed: boolean;
}

const store = createStore<PictureInPictureState>('PictureInPictureProvider');

export const PictureInPictureProvider = store.Provider;
export const usePictureInPicture = store.useStore;

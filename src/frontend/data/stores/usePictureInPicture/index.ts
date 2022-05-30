import { createStore } from 'utils/createContext';

interface PictureInPictureState {
  reversed: boolean;
}

const store = createStore<PictureInPictureState>();

export const PictureInPictureProvider = store.Provider;
export const usePictureInPicture = store.useStore;

import { createStore } from 'utils/createContext';
import { Nullable } from 'utils/types';

interface InformativeModal {
  title: string;
  text: string;
}

const store = createStore<Nullable<InformativeModal>>(
  'InfoWidgetModalProvider',
);

export const InfoWidgetModalProvider = store.Provider;
export const useInfoWidgetModal = store.useStore;

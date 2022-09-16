import { Nullable } from 'lib-common';

import { createStore } from 'utils/createContext';

interface InformativeModal {
  title: string;
  text: string;
}

const store = createStore<Nullable<InformativeModal>>(
  'InfoWidgetModalProvider',
);

export const InfoWidgetModalProvider = store.Provider;
export const useInfoWidgetModal = store.useStore;

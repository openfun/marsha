import { Nullable } from 'lib-common';
import { createStore } from 'lib-components';

interface InformativeModal {
  title: string;
  text: string;
}

const store = createStore<Nullable<InformativeModal>>(
  'InfoWidgetModalProvider',
);

export const InfoWidgetModalProvider = store.Provider;
export const useInfoWidgetModal = store.useStore;

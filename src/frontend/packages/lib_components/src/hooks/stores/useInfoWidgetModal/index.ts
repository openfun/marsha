import { Nullable } from 'lib-common';

import { createStore } from '@lib-components/utils';

interface InformativeModal {
  title: string;
  text: string;
  refWidget?: HTMLDivElement | null;
}

const store = createStore<Nullable<InformativeModal>>(
  'InfoWidgetModalProvider',
);

export const InfoWidgetModalProvider = store.Provider;
export const useInfoWidgetModal = store.useStore;

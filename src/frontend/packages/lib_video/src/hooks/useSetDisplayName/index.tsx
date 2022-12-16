import { createStore } from 'lib-components';

const store = createStore<boolean>('useSetDisplayName');

export const SetDisplayNameProvider = store.Provider;
export const useSetDisplayName = store.useStore;

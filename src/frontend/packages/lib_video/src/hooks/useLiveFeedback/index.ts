import { createStore } from 'lib-components';

const store = createStore<boolean>('useLiveFeedback');

export const LiveFeedbackProvider = store.Provider;
export const useLiveFeedback = store.useStore;

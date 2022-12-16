import { Maybe } from 'lib-common';
import { createStore, JitsiMeetExternalAPI } from 'lib-components';

const store = createStore<Maybe<JitsiMeetExternalAPI>>('JitsiApiProvider');

export const JitsiApiProvider = store.Provider;
export const useJitsiApi = store.useStore;

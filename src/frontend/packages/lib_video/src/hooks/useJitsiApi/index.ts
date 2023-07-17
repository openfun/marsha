import { Maybe } from 'lib-common';
import { JitsiMeetExternalAPI, createStore } from 'lib-components';

const store = createStore<Maybe<JitsiMeetExternalAPI>>('JitsiApiProvider');

export const JitsiApiProvider = store.Provider;
export const useJitsiApi = store.useStore;

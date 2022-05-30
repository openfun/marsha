import { createStore } from 'utils/createContext';
import { Maybe } from 'utils/types';

const store = createStore<Maybe<JitsiMeetExternalAPI>>();

export const JitsiApiProvider = store.Provider;
export const useJitsiApi = store.useStore;

import { LiveModaleProps } from 'components/LiveModale';
import { createStore } from 'utils/createContext';
import { Nullable } from 'utils/types';

const store = createStore<Nullable<LiveModaleProps>>('useLiveModale');

export const LiveModaleConfigurationProvider = store.Provider;
export const useLiveModaleConfiguration = store.useStore;

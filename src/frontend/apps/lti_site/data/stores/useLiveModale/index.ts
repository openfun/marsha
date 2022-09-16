import { Nullable } from 'lib-common';

import { LiveModaleProps } from 'components/LiveModale';
import { createStore } from 'utils/createContext';

const store = createStore<Nullable<LiveModaleProps>>('useLiveModale');

export const LiveModaleConfigurationProvider = store.Provider;
export const useLiveModaleConfiguration = store.useStore;

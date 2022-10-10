import { ResourceContext } from '../../../types/ResourceContext';
import { createStore } from '../../../utils/createContext';

const store = createStore<ResourceContext>('CurrentResourceContext');

export const CurrentResourceContextProvider = store.Provider;
export const useCurrentResourceContext = store.useStore;

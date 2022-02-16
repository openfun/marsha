import React from 'react';

type StoreContextType<TStore> = [
  TStore,
  React.Dispatch<React.SetStateAction<TStore>>,
];

interface ProviderProps<TStore> {
  value: TStore;
  children: React.ReactNode;
}

interface StoreComponents<TStore> {
  Provider: React.FC<ProviderProps<TStore>>;
  useStore: () => StoreContextType<TStore>;
}

export function createStore<TStore>(): StoreComponents<TStore> {
  const StoreContext = React.createContext<
    StoreContextType<TStore> | undefined
  >(undefined);

  const useStore: () => StoreContextType<TStore> = () => {
    const globalStore = React.useContext(StoreContext);
    if (!globalStore) {
      throw new Error('Missing wrapping Provider for Store');
    }
    return globalStore;
  };

  const Provider: React.FC<ProviderProps<TStore>> = ({
    children,
    value,
  }: ProviderProps<TStore>) => {
    const storeState = React.useState<TStore>(value);

    return (
      <StoreContext.Provider value={storeState}>
        {children}
      </StoreContext.Provider>
    );
  };

  return {
    Provider,
    useStore,
  };
}

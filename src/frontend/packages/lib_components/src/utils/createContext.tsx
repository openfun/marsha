import React, { createContext, useContext, useState } from 'react';

type StoreContextType<TStore> = [
  TStore,
  React.Dispatch<React.SetStateAction<TStore>>,
];

export interface ProviderProps<TStore> {
  value: TStore;
  children: React.ReactNode;
}

interface StoreComponents<TStore> {
  Provider: React.FC<ProviderProps<TStore>>;
  useStore: () => StoreContextType<TStore>;
}

export function createStore<TStore>(
  storeName: string,
): StoreComponents<TStore> {
  const StoreContext = createContext<StoreContextType<TStore> | undefined>(
    undefined,
  );

  const useStore: () => StoreContextType<TStore> = () => {
    const globalStore = useContext(StoreContext);
    if (!globalStore) {
      throw new Error(`Missing wrapping Provider for Store ${storeName}`);
    }
    return globalStore;
  };

  const Provider: React.FC<ProviderProps<TStore>> = ({
    children,
    value,
  }: ProviderProps<TStore>) => {
    const storeState = useState<TStore>(value);

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

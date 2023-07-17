import { Nullable } from 'lib-common';
import React, { PropsWithChildren, createContext, useContext } from 'react';

import { AppConfig } from '@lib-components/types/AppData';

const StoreContext = createContext<Nullable<AppConfig>>(null);

interface ProviderType {
  value: AppConfig;
}

export const AppConfigProvider = ({
  children,
  value,
}: PropsWithChildren<ProviderType>) => {
  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
};

export const useAppConfig = () => {
  const context = useContext(StoreContext);
  if (context === null) {
    throw new Error('App has not be configured yet.');
  }
  return context;
};

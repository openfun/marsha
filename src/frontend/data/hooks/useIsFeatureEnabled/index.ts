import { useAppConfig } from 'data/stores/useAppConfig';
import { useCallback } from 'react';
import { flags } from 'types/AppData';

export const useIsFeatureEnabled = () => {
  const appData = useAppConfig();

  return useCallback(
    (name: flags) => {
      return appData.flags ? appData.flags[name] ?? false : false;
    },
    [appData],
  );
};

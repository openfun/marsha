import { flags, useAppConfig } from 'lib-components';
import { useCallback } from 'react';

export const useIsFeatureEnabled = () => {
  const appData = useAppConfig();

  return useCallback(
    (name: flags) => {
      return appData.flags ? appData.flags[name] ?? false : false;
    },
    [appData],
  );
};

import { useCallback } from 'react';

import { useAppConfig } from 'data/stores/useAppConfig';
import { flags } from 'lib-components';

export const useIsFeatureEnabled = () => {
  const appData = useAppConfig();

  return useCallback(
    (name: flags) => {
      return appData.flags ? appData.flags[name] ?? false : false;
    },
    [appData],
  );
};

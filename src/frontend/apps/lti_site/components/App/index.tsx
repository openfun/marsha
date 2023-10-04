import { AppConfigProvider, BoxLoader } from 'lib-components';
import React, { Suspense, lazy } from 'react';

import { parseDataElements } from 'utils/parseDataElements/parseDataElements';

import { AppInitializer } from './AppInitializer';

const AppContentLoader = lazy(() => import('./AppContentLoader'));
const { jwt, refresh_token, ...appConfig } = parseDataElements(
  document.getElementById('marsha-frontend-data'),
);

export const App = () => {
  return (
    <AppConfigProvider value={appConfig}>
      <AppInitializer jwt={jwt} refresh_token={refresh_token}>
        <Suspense fallback={<BoxLoader />}>
          <AppContentLoader />
        </Suspense>
      </AppInitializer>
    </AppConfigProvider>
  );
};

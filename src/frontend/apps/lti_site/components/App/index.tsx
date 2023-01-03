import React, { lazy, Suspense } from 'react';

import { Loader, useJwt, AppConfigProvider } from 'lib-components';
import { parseDataElements } from 'utils/parseDataElements/parseDataElements';

import { AppInitializer } from './AppInitializer';

const AppContentLoader = lazy(() => import('./AppContentLoader'));

const domElementToParse = document.getElementById('marsha-frontend-data');
if (!domElementToParse) {
  throw new Error('Appdata are missing from DOM.');
}
const { jwt, ...appConfig } = parseDataElements(domElementToParse);

useJwt.persist.setOptions({
  name: `jwt-store-${appConfig.modelName}-${appConfig.resource?.id || ''}`,
});

useJwt.setState({ jwt });

export const App = () => {
  return (
    <AppConfigProvider value={appConfig}>
      <AppInitializer>
        <Suspense fallback={<Loader />}>
          <AppContentLoader />
        </Suspense>
      </AppInitializer>
    </AppConfigProvider>
  );
};

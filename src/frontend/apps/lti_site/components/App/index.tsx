import { AppConfigProvider, Loader } from 'lib-components';
import React, { Suspense, lazy } from 'react';

import { parseDataElements } from 'utils/parseDataElements/parseDataElements';

import { AppInitializer } from './AppInitializer';

const AppContentLoader = lazy(() => import('./AppContentLoader'));

const domElementToParse = document.getElementById('marsha-frontend-data');
if (!domElementToParse) {
  throw new Error('Appdata are missing from DOM.');
}
const { jwt, refresh_token, ...appConfig } =
  parseDataElements(domElementToParse);

export const App = () => {
  return (
    <AppConfigProvider value={appConfig}>
      <AppInitializer jwt={jwt} refresh_token={refresh_token}>
        <Suspense fallback={<Loader />}>
          <AppContentLoader />
        </Suspense>
      </AppInitializer>
    </AppConfigProvider>
  );
};

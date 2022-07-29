import React, { lazy, Suspense } from 'react';

import { Loader } from 'components/Loader';
import { AppConfigProvider } from 'data/stores/useAppConfig';
import { useJwt } from 'data/stores/useJwt';
import { parseDataElements } from 'utils/parseDataElements/parseDataElements';

import { AppInitializer } from './AppInitializer';

const AppContentLoader = lazy(() => import('./AppContentLoader'));

const domElementToParse = document.getElementById('marsha-frontend-data');
if (!domElementToParse) {
  throw new Error('Appdata are missing from DOM.');
}
const { jwt, ...appConfig } = parseDataElements(domElementToParse);
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

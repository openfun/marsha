import { CunninghamProvider } from '@openfun/cunningham-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Grommet } from 'grommet';
import { colorsTokens } from 'lib-common';
import { retryQuery } from 'lib-components';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';

import { getFullThemeExtend } from 'styles/theme.extend';

import AppConfig from './AppConfig';
import AppRoutes from './AppRoutes';

const themeExtended = getFullThemeExtend();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: retryQuery,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />
      <CunninghamProvider>
        <Grommet theme={themeExtended}>
          <Toaster
            toastOptions={{
              duration: 5000,
              success: {
                style: {
                  background: colorsTokens['success-600'],
                  color: 'white',
                },
              },
              error: {
                style: {
                  color: 'white',
                  background: colorsTokens['danger-400'],
                },
              },
            }}
          />
          <AppConfig>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AppConfig>
        </Grommet>
      </CunninghamProvider>
    </QueryClientProvider>
  );
};

export default App;

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Grommet } from 'grommet';
import { colors } from 'lib-common';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';

import { getFullThemeExtend } from 'styles/theme.extend';

import AppConfig from './AppConfig';
import AppRoutes from './AppRoutes';

const themeExtended = getFullThemeExtend();
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />
      <Grommet theme={themeExtended}>
        <Toaster
          toastOptions={{
            duration: 5000,
            success: {
              style: {
                background: colors['status-ok'],
              },
            },
            error: {
              style: {
                color: colors['white'],
                background: colors['accent-2'],
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
    </QueryClientProvider>
  );
};

export default App;

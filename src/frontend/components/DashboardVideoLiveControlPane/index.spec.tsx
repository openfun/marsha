import { render, screen } from '@testing-library/react';
import { ResponsiveContext } from 'grommet';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { DashboardVideoLiveControlPane } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'json web token',
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  },
}));

describe('<DashboardVideoLiveControlPane />', () => {
  it('renders configuration and attendance tabs', () => {
    const mockVideo = videoMockFactory({
      id: '5cffe85a-1829-4000-a6ca-a45d4647dc0d',
      live_state: liveState.RUNNING,
    });

    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <ResponsiveContext.Provider value="large">
            <DashboardVideoLiveControlPane video={mockVideo} />
          </ResponsiveContext.Provider>
        </QueryClientProvider>,
      ),
    );
    screen.getByRole('tab', { name: 'configuration' });
    screen.getByRole('tab', { name: 'attendances' });
  });
});

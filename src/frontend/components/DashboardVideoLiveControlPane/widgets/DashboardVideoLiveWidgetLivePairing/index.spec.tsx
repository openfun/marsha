import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { DashboardVideoLiveWidgetLivePairing } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'some token',
  },
}));

describe('DashboardVideoLiveWidgetLivePairing', () => {
  it('displays the appairing button', () => {
    const video = videoMockFactory({
      live_state: liveState.IDLE,
    });
    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardVideoLiveWidgetLivePairing video={video} />
        </QueryClientProvider>,
      ),
    );

    expect(
      screen.queryByRole('button', {
        name: /pair an external device/i,
      }),
    ).not.toBeInTheDocument();

    // open the widget
    const openButton = screen.getByRole('button', {
      name: 'External broadcast sources',
    });
    userEvent.click(openButton);

    screen.getByRole('button', {
      name: /pair an external device/i,
    });
  });
});

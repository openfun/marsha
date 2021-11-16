import { act, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Grommet } from 'grommet';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { Deferred } from 'utils/tests/Deferred';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { DashboardVideoLivePairing } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'some token',
  },
}));

describe('<DashboardVideoLivePairing />', () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    fetchMock.restore();
    jest.useRealTimers();
  });

  it('requests a pairing secret', async () => {
    const video = videoMockFactory();

    const pairingSecretDefered = new Deferred();
    fetchMock.get(
      `/api/videos/${video.id}/pairing-secret/`,
      pairingSecretDefered.promise,
    );

    const queryClient = new QueryClient();
    render(
      wrapInIntlProvider(
        <Grommet>
          <QueryClientProvider client={queryClient}>
            <DashboardVideoLivePairing video={video} />
          </QueryClientProvider>
        </Grommet>,
      ),
    );

    const pairButton = screen.getByRole('button', {
      name: /pair an external device/i,
    });
    pairButton.click();

    await act(async () =>
      pairingSecretDefered.resolve({ secret: '123456', expires_in: '60' }),
    );

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/pairing-secret/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });

    screen.getByText('Pairing secret: 123456');

    // secret is stll displayed after 59 seconds
    act(() => {
      // advance time by 59 second
      jest.advanceTimersByTime(1000 * 59);
    });
    screen.getByText('Pairing secret: 123456');

    // secret expiration is displayed after 1 minute
    act(() => {
      // advance time by 3 second
      jest.advanceTimersByTime(1000 * 3);
    });
    screen.getByText('Pairing secret expired');
    const pairingSecretDisplay = screen.queryByText('Pairing secret: 123456');
    expect(pairingSecretDisplay).not.toBeInTheDocument();
    const pairingSecretLabel = screen.queryByText('Pair an external device');
    expect(pairingSecretLabel).not.toBeInTheDocument();

    act(() => {
      // advance time by 4 second
      jest.advanceTimersByTime(1000 * 4);
    });
    screen.getByText('Pair an external device');
    const pairingSecretExpiration = screen.queryByText(
      'Pairing secret expired',
    );
    expect(pairingSecretExpiration).not.toBeInTheDocument();
  });
});

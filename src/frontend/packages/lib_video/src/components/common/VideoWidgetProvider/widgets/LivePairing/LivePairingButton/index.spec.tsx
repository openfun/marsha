import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { liveState, useJwt, videoMockFactory } from 'lib-components';
import { Deferred, advanceJestTimersByTime, render } from 'lib-tests';
import React from 'react';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { LivePairingButton } from '.';

describe('<DashboardLivePairing />', () => {
  beforeEach(() => {
    jest.useFakeTimers();

    useJwt.getState().setJwt('some token');
  });

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

    render(wrapInVideo(<LivePairingButton />, video));

    const pairButton = screen.getByRole('button', {
      name: /pair an external device/i,
    });
    pairButton.click();

    pairingSecretDefered.resolve({ secret: '123456', expires_in: '60' });

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${video.id}/pairing-secret/`,
      ),
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
    // advance time by 59 second
    advanceJestTimersByTime(1000, 59);
    await screen.findByText('Pairing secret: 123456');

    // secret expiration is displayed after 1 minute
    // advance time by 1 second 3 times
    advanceJestTimersByTime(1000, 3);

    await screen.findByText('Pairing secret expired');
    const pairingSecretDisplay = screen.queryByText('Pairing secret: 123456');
    expect(pairingSecretDisplay).not.toBeInTheDocument();
    const pairingSecretLabel = screen.queryByText('Pair an external device');
    expect(pairingSecretLabel).not.toBeInTheDocument();

    // advance time by 1 second 4 times
    advanceJestTimersByTime(1000, 4);
    await screen.findByText('Pair an external device');
    const pairingSecretExpiration = screen.queryByText(
      'Pairing secret expired',
    );
    expect(pairingSecretExpiration).not.toBeInTheDocument();
  });

  it('disables the button when the live state is stopped', () => {
    const video = videoMockFactory({
      live_state: liveState.STOPPED,
    });

    render(wrapInVideo(<LivePairingButton />, video));

    const pairButton = screen.getByRole('button', {
      name: /pair an external device/i,
    });

    expect(pairButton).toBeDisabled();
  });
});

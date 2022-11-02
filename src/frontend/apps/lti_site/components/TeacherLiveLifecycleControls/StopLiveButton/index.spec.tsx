import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useJwt, videoMockFactory } from 'lib-components';
import { render, Deferred } from 'lib-tests';
import React from 'react';

import { stopLive } from 'data/sideEffects/stopLive';
import { liveState, Video, useVideo } from 'lib-components';
import { wrapInLiveModaleProvider } from 'utils/tests/liveModale';

import { StopLiveButton } from '.';

jest.mock('jwt-decode', () => jest.fn());

jest.mock('data/sideEffects/stopLive', () => ({
  stopLive: jest.fn(),
}));
const mockedStopLive = stopLive as jest.MockedFunction<typeof stopLive>;

describe('<StopLiveButton />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'cool_token_m8',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders a loader while fetching and updates the video', async () => {
    const video = videoMockFactory({ live_state: liveState.IDLE });
    const stopDeferred = new Deferred<Video>();
    mockedStopLive.mockReturnValue(stopDeferred.promise);

    render(wrapInLiveModaleProvider(<StopLiveButton video={video} />));

    expect(screen.queryByTestId('loader-id')).not.toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'End live' }));
    userEvent.click(screen.getByRole('button', { name: 'Stop the live' }));

    screen.getByTestId('loader-id');

    stopDeferred.resolve({ ...video, live_state: liveState.STOPPING });

    await waitForElementToBeRemoved(() => screen.queryByTestId('loader-id'));

    expect(useVideo.getState().videos[video.id]).toEqual({
      ...video,
      live_state: liveState.STOPPING,
    });
  });

  it('renders a toast on fail', async () => {
    const video = videoMockFactory({ live_state: liveState.IDLE });
    mockedStopLive.mockRejectedValue(null);

    render(wrapInLiveModaleProvider(<StopLiveButton video={video} />));

    userEvent.click(screen.getByRole('button', { name: 'End live' }));
    userEvent.click(screen.getByRole('button', { name: 'Stop the live' }));

    await screen.findByText('An error occured, please try again.');
  });

  it('updates the state to open a confirmation modal', async () => {
    const video = videoMockFactory();

    render(wrapInLiveModaleProvider(<StopLiveButton video={video} />));

    expect(screen.queryByTestId('loader-id')).not.toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'End live' }));

    const liveModale = screen.getByTestId('test-modale');
    expect(liveModale).toHaveTextContent('You are about to stop the live.');
    expect(liveModale).toHaveTextContent('Every viewers will be disconnected.');
    expect(liveModale).toHaveTextContent(
      'Are you sure you want to stop this Live ?',
    );
    expect(liveModale).toHaveTextContent(
      'Beware, live is still running until stopped.',
    );
    screen.getByRole('button', { name: 'Stop the live' });
    screen.getByRole('button', { name: 'Cancel' });
  });
});

import {
  cleanup,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { startLive } from 'data/sideEffects/startLive';
import { useVideo } from 'data/stores/useVideo';
import { liveState, Video } from 'types/tracks';
import { Deferred } from 'utils/tests/Deferred';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInLiveModaleProvider } from 'utils/tests/liveModale';
import render from 'utils/tests/render';

import { StartLiveButton } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

jest.mock('data/sideEffects/startLive', () => ({
  startLive: jest.fn(),
}));
const mockedStartLive = startLive as jest.MockedFunction<typeof startLive>;

describe('<StartLiveButton />', () => {
  it('renders a loader while fetching and updates the video', async () => {
    const video = videoMockFactory({ live_state: liveState.IDLE });
    const startDeferred = new Deferred<Video>();
    mockedStartLive.mockReturnValue(startDeferred.promise);

    render(wrapInLiveModaleProvider(<StartLiveButton video={video} />));

    expect(screen.queryByTestId('loader-id')).not.toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'Start streaming' }));

    screen.getByTestId('loader-id');

    startDeferred.resolve({ ...video, live_state: liveState.RUNNING });

    await waitForElementToBeRemoved(() => screen.queryByTestId('loader-id'));

    expect(useVideo.getState().videos[video.id]).toEqual({
      ...video,
      live_state: liveState.RUNNING,
    });

    cleanup();
  });

  it('renders a toast on fail', async () => {
    const video = videoMockFactory({ live_state: liveState.IDLE });
    mockedStartLive.mockRejectedValue(null);

    render(wrapInLiveModaleProvider(<StartLiveButton video={video} />));

    userEvent.click(screen.getByRole('button', { name: 'Start streaming' }));

    await screen.findByText('An error occured, please try again.');
  });

  it('displays an alert message when starting an harvested live', async () => {
    const video = videoMockFactory({ live_state: liveState.HARVESTED });
    const startDeferred = new Deferred<Video>();
    mockedStartLive.mockReturnValue(startDeferred.promise);

    render(wrapInLiveModaleProvider(<StartLiveButton video={video} />));

    userEvent.click(screen.getByRole('button', { name: 'Start streaming' }));

    const liveModale = screen.getByTestId('test-modale');
    expect(liveModale).toHaveTextContent(
      'Beware, you are about to start a live you have already harvested.If you proceed, your previous live record will be lost.Please confirm you want to erase your previous video and start a new live.',
    );
    screen.getByRole('button', { name: 'Cancel' });
    expect(
      screen.getAllByRole('button', { name: 'Start streaming' }).length,
    ).toEqual(2);
  });
});

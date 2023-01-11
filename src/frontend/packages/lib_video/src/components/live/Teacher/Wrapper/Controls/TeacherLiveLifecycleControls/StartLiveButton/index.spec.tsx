import {
  cleanup,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useJwt,
  videoMockFactory,
  liveState,
  Video,
  useVideo,
} from 'lib-components';
import { render, Deferred } from 'lib-tests';
import React from 'react';

import { startLive } from 'api/startLive';
import { wrapInLiveModaleProvider } from 'utils/liveModale';

import { StartLiveButton } from '.';

jest.mock('jwt-decode', () => jest.fn());

jest.mock('api/startLive', () => ({
  startLive: jest.fn(),
}));
const mockedStartLive = startLive as jest.MockedFunction<typeof startLive>;

describe('<StartLiveButton />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'cool_token_m8',
    });
  });

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

    expect(
      await screen.findByText('An error occured, please try again.'),
    ).toBeInTheDocument();
  });

  it('displays an alert message when starting an harvested live', () => {
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

import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchMediaMock from 'jest-matchmedia-mock';
import React, { Fragment } from 'react';
import { Toaster } from 'react-hot-toast';

import { stopLive } from 'data/sideEffects/stopLive';
import { useVideo } from 'data/stores/useVideo';
import { liveState, Video } from 'types/tracks';
import { Deferred } from 'utils/tests/Deferred';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInLiveModaleProvider } from 'utils/tests/liveModale';

import { StopLiveButton } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

jest.mock('data/sideEffects/stopLive', () => ({
  stopLive: jest.fn(),
}));
const mockedStopLive = stopLive as jest.MockedFunction<typeof stopLive>;

let matchMedia: MatchMediaMock;

describe('<StopLiveButton />', () => {
  beforeEach(() => {
    matchMedia = new MatchMediaMock();
  });
  afterEach(() => {
    jest.clearAllMocks();
    matchMedia.clear();

    /*
      make sure to remove all body children, grommet layer gets rendered twice, known issue
      https://github.com/grommet/grommet/issues/5200
    */
    document.body.innerHTML = '';
    document.body.appendChild(document.createElement('div'));
  });

  it('renders a loader while fetching and updates the video', async () => {
    const video = videoMockFactory({ live_state: liveState.IDLE });
    const stopDeferred = new Deferred<Video>();
    mockedStopLive.mockReturnValue(stopDeferred.promise);

    render(
      wrapInIntlProvider(
        wrapInLiveModaleProvider(<StopLiveButton video={video} />),
      ),
    );

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

    render(
      wrapInIntlProvider(
        wrapInLiveModaleProvider(
          <Fragment>
            <Toaster />
            <StopLiveButton video={video} />
          </Fragment>,
        ),
      ),
    );

    userEvent.click(screen.getByRole('button', { name: 'End live' }));
    userEvent.click(screen.getByRole('button', { name: 'Stop the live' }));

    await screen.findByText('An error occured, please try again.');
  });

  it('updates the state to open a confirmation modal', async () => {
    const video = videoMockFactory();

    render(
      wrapInIntlProvider(
        wrapInLiveModaleProvider(<StopLiveButton video={video} />),
      ),
    );

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

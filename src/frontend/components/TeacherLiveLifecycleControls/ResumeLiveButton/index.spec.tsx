import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchMediaMock from 'jest-matchmedia-mock';
import React, { Fragment } from 'react';
import { Toaster } from 'react-hot-toast';

import { startLive } from 'data/sideEffects/startLive';
import { useVideo } from 'data/stores/useVideo';
import { liveState, Video } from 'types/tracks';
import { Deferred } from 'utils/tests/Deferred';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { ResumeLiveButton } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

jest.mock('data/sideEffects/startLive', () => ({
  startLive: jest.fn(),
}));
const mockedStartLive = startLive as jest.MockedFunction<typeof startLive>;

let mockStopLiveConfirmation = false;
const mockSetStopLiveConfirmation = jest.fn();
jest.mock('data/stores/useStopLiveConfirmation', () => ({
  useStopLiveConfirmation: () => [
    mockStopLiveConfirmation,
    mockSetStopLiveConfirmation,
  ],
}));

let matchMedia: MatchMediaMock;

describe('<ResumeLiveButton />', () => {
  beforeEach(() => {
    matchMedia = new MatchMediaMock();
    mockStopLiveConfirmation = false;
  });

  afterEach(() => {
    matchMedia.clear();

    jest.clearAllMocks();

    /*
      make sure to remove all body children, grommet layer gets rendered twice, known issue
      https://github.com/grommet/grommet/issues/5200
    */
    document.body.innerHTML = '';
    document.body.appendChild(document.createElement('div'));
  });

  it('renders a loader while fetching and updates the video', async () => {
    const video = videoMockFactory({ live_state: liveState.PAUSED });
    const startDeferred = new Deferred<Video>();
    mockedStartLive.mockReturnValue(startDeferred.promise);

    render(wrapInIntlProvider(<ResumeLiveButton video={video} />));

    expect(screen.queryByTestId('loader-id')).not.toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'Resume streaming' }));

    screen.getByTestId('loader-id');

    startDeferred.resolve({ ...video, live_state: liveState.RUNNING });

    await waitForElementToBeRemoved(() => screen.queryByTestId('loader-id'));

    expect(useVideo.getState().videos[video.id]).toEqual({
      ...video,
      live_state: liveState.RUNNING,
    });

    expect(mockSetStopLiveConfirmation).toHaveBeenCalled();
    expect(mockSetStopLiveConfirmation).toHaveBeenCalledWith(false);
  });

  it('renders a toast on fail', async () => {
    const video = videoMockFactory({ live_state: liveState.PAUSED });
    mockedStartLive.mockRejectedValue(null);

    render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <ResumeLiveButton video={video} />
        </Fragment>,
      ),
    );

    userEvent.click(screen.getByRole('button', { name: 'Resume streaming' }));

    await screen.findByText('An error occured, please try again.');

    expect(mockSetStopLiveConfirmation).not.toHaveBeenCalled();
  });

  it('rendes the button disable when stop confirmation modal is open', () => {
    const video = videoMockFactory({ live_state: liveState.PAUSED });
    mockedStartLive.mockRejectedValue(null);
    mockStopLiveConfirmation = true;

    render(wrapInIntlProvider(<ResumeLiveButton video={video} />));

    expect(
      screen.getByRole('button', { name: 'Resume streaming' }),
    ).toBeDisabled();
    expect(screen.queryByTestId('loader-id')).not.toBeInTheDocument();
  });
});

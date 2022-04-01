import MatchMediaMock from 'jest-matchmedia-mock';
import React, { Fragment } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { endLive } from 'data/sideEffects/endLive';
import { liveState, Video } from 'types/tracks';
import { Deferred } from 'utils/tests/Deferred';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { TeacherLiveStopConfirmation } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

const mockStopLiveConfirmation = false;
const mockSetStopLiveConfirmation = jest.fn();
jest.mock('data/stores/useStopLiveConfirmation', () => ({
  useStopLiveConfirmation: () => [
    mockStopLiveConfirmation,
    mockSetStopLiveConfirmation,
  ],
}));

jest.mock('data/sideEffects/endLive', () => ({
  endLive: jest.fn(),
}));
const mockedEndLive = endLive as jest.MockedFunction<typeof endLive>;

let matchMedia: MatchMediaMock;

describe('<TeacherLiveStopConfirmation />', () => {
  beforeEach(() => {
    matchMedia = new MatchMediaMock();
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

  it('renders all components', () => {
    const video = videoMockFactory();

    render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <TeacherLiveStopConfirmation video={video} />
        </Fragment>,
      ),
    );

    screen.getByRole('heading', { name: video.title! });

    screen.getByRole('button', { name: 'Stop the live' });
    screen.getByRole('button', { name: 'Cancel' });

    screen.getByText(/You are about to stop the live./);
    screen.getByText(/Every viewers will be disconnected./);
    screen.getByText(/Are you sure you want to stop this Live ?/);
  });

  it('updates the store on cancel button click', () => {
    const video = videoMockFactory();

    render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <TeacherLiveStopConfirmation video={video} />
        </Fragment>,
      ),
    );

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockSetStopLiveConfirmation).toHaveBeenCalled();
    expect(mockSetStopLiveConfirmation).toHaveBeenCalledWith(false);
  });

  it('stops the live on stop live button click', async () => {
    const endDeferred = new Deferred<Video>();
    mockedEndLive.mockReturnValue(endDeferred.promise);

    const video = videoMockFactory();

    render(wrapInIntlProvider(<TeacherLiveStopConfirmation video={video} />));

    userEvent.click(screen.getByRole('button', { name: 'Stop the live' }));

    await screen.findByTestId('loader-id');
    screen.getByTestId('loader-id');

    endDeferred.resolve({ ...video, live_state: liveState.STOPPED });

    await waitForElementToBeRemoved(() => screen.queryByTestId('loader-id'));

    expect(mockSetStopLiveConfirmation).not.toHaveBeenCalled();
  });

  it('says harvesting message when live is stopped', () => {
    const video = videoMockFactory({ live_state: liveState.STOPPED });

    render(wrapInIntlProvider(<TeacherLiveStopConfirmation video={video} />));

    screen.getByText('Live is stopped, harvesting will begin soon.');
  });

  it('toasts an error', async () => {
    mockedEndLive.mockRejectedValue(null);

    const video = videoMockFactory();

    render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <TeacherLiveStopConfirmation video={video} />
        </Fragment>,
      ),
    );

    userEvent.click(screen.getByRole('button', { name: 'Stop the live' }));

    await screen.findByText('An error occured, please try again.');
  });
});

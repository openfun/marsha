import { Grommet } from 'grommet';
import { DateTime } from 'luxon';
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';

import { getResource } from 'data/sideEffects/getResource';
import { resumeLive } from 'utils/resumeLive';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { PublicPausedLiveVideo } from '.';
import { modelName } from 'types/models';

jest.mock('video.js', () => ({
  __esModule: true,
  default: {
    getPlayers: () => ({
      bb8: {
        currentSource: () => 'https://live.m3u8',
        src: jest.fn(),
      },
    }),
  },
}));

jest.mock('data/sideEffects/getResource', () => ({
  getResource: jest.fn(),
}));
jest.mock('utils/resumeLive', () => ({
  resumeLive: jest.fn(),
}));

const mockResumeLive = resumeLive as jest.MockedFunction<typeof resumeLive>;
const mockGetResource = getResource as jest.MockedFunction<typeof getResource>;

describe('PublicPausedLiveVideo', () => {
  beforeEach(() => {
    /*
      make sure to remove all body children, grommet layer gets rendered twice, known issue
      https://github.com/grommet/grommet/issues/5200
    */
    document.body.innerHTML = '';
    document.body.appendChild(document.createElement('div'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with the timer', () => {
    const video = videoMockFactory({
      live_info: {
        paused_at: `${DateTime.now().minus({ seconds: 5 }).toSeconds()}`,
      },
    });
    const videoNode = document.createElement('video');
    mockResumeLive.mockResolvedValue();

    render(
      wrapInIntlProvider(
        <Grommet>
          <PublicPausedLiveVideo video={video} videoNodeRef={videoNode} />
        </Grommet>,
      ),
    );

    screen.getByText('Webinar is paused');
    screen.getByText(
      'The webinar is paused. When resumed, the video will start again.',
    );
    const waitingSentence = screen.getByText(/the webinar is paused since/i);
    expect(waitingSentence).toHaveTextContent(
      'The webinar is paused since 00:00:05',
    );
    expect(mockGetResource).not.toHaveBeenCalled();
  });

  it('renders the component without timer', () => {
    const video = videoMockFactory();
    const videoNode = document.createElement('video');
    mockResumeLive.mockResolvedValue();

    render(
      wrapInIntlProvider(
        <Grommet>
          <PublicPausedLiveVideo video={video} videoNodeRef={videoNode} />
        </Grommet>,
      ),
    );

    screen.getByText('Webinar is paused');
    screen.getByText(
      'The webinar is paused. When resumed, the video will start again.',
    );
    expect(
      screen.queryByText(/the webinar is in paused since/i),
    ).not.toBeInTheDocument();

    expect(mockResumeLive).toHaveBeenCalledWith(video);
    expect(mockGetResource).not.toHaveBeenCalled();
  });

  it('calls getResource to refresh video state if resumeLive function fails', async () => {
    const video = videoMockFactory({
      live_info: {
        paused_at: `${DateTime.now().minus({ seconds: 5 }).toSeconds()}`,
      },
    });
    const videoNode = document.createElement('video');
    mockResumeLive.mockRejectedValue('');

    render(
      wrapInIntlProvider(
        <Grommet>
          <PublicPausedLiveVideo video={video} videoNodeRef={videoNode} />
        </Grommet>,
      ),
    );

    screen.getByText('Webinar is paused');
    screen.getByText(
      'The webinar is paused. When resumed, the video will start again.',
    );
    const waitingSentence = screen.getByText(/the webinar is paused since/i);
    expect(waitingSentence).toHaveTextContent(
      'The webinar is paused since 00:00:05',
    );
    await waitFor(() =>
      expect(mockGetResource).toHaveBeenCalledWith(modelName.VIDEOS, video.id),
    );
  });

  it('displays day and time when live is paused since more than 24 hours', () => {
    jest.useFakeTimers();
    const video = videoMockFactory({
      live_info: {
        paused_at: `${DateTime.now().minus({ days: 1, hours: 3 }).toSeconds()}`,
      },
    });
    const videoNode = document.createElement('video');
    mockResumeLive.mockResolvedValue();

    render(
      wrapInIntlProvider(
        <Grommet>
          <PublicPausedLiveVideo video={video} videoNodeRef={videoNode} />
        </Grommet>,
      ),
    );

    screen.getByText('Webinar is paused');
    screen.getByText(
      'The webinar is paused. When resumed, the video will start again.',
    );
    const waitingSentence = screen.getByText(/the webinar is paused since/i);
    expect(waitingSentence).toHaveTextContent(
      'The webinar is paused since 1 day + 03:00:00',
    );
  });

  it('resets the Clock and displays day when the live overtakes 24 hours', async () => {
    const video = videoMockFactory({
      live_info: {
        paused_at: `${DateTime.now()
          .minus({ hours: 23, minutes: 59, seconds: 59 })
          .toSeconds()}`,
      },
    });
    const videoNode = document.createElement('video');
    mockResumeLive.mockResolvedValue();

    render(
      wrapInIntlProvider(
        <Grommet>
          <PublicPausedLiveVideo video={video} videoNodeRef={videoNode} />
        </Grommet>,
      ),
    );

    await screen.findByText('Webinar is paused');
    screen.getByText(
      'The webinar is paused. When resumed, the video will start again.',
    );
    const waitingSentence = await screen.findByText(
      /the webinar is paused since/i,
    );
    expect(waitingSentence).toHaveTextContent(
      'The webinar is paused since 23:59:59',
    );

    act(() => {
      // advance time by 5 seconds and few milliseconds to avoid the
      // div added by the component Clock while digits are changing
      jest.advanceTimersByTime(5600);
    });

    const newWaitingSentence = await screen.findByText(
      /the webinar is paused since 1 day +/i,
    );
    expect(newWaitingSentence).toHaveTextContent(
      'The webinar is paused since 1 day + 00:00:03',
    );
  });
});

import { screen } from '@testing-library/react';
import { videoMockFactory } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { VideoPlayer } from '@lib-video/components/common/VideoPlayer';
import DashboardLiveRaw from '@lib-video/components/live/common/DashboardLiveRaw';
import { LiveFeedbackProvider } from '@lib-video/hooks/useLiveFeedback';

import TeacherLiveRawWrapper from '.';

jest.mock('components/common/VideoPlayer', () => ({
  VideoPlayer: jest
    .fn()
    .mockImplementation((_: any) => <span>videojs player</span>),
}));
const mockedVideoPlayer = VideoPlayer as jest.MockedFunction<
  typeof VideoPlayer
>;

jest.mock('components/live/common/DashboardLiveRaw', () =>
  jest.fn().mockImplementation((_: any) => <span>dashboard raw</span>),
);
const mockedDashboardRaw = DashboardLiveRaw as jest.MockedFunction<
  typeof DashboardLiveRaw
>;

describe('<TeacherLiveRawWrapper />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the player', () => {
    const video = videoMockFactory();

    render(
      <LiveFeedbackProvider value={true}>
        <TeacherLiveRawWrapper video={video} />
      </LiveFeedbackProvider>,
    );

    screen.getByText('videojs player');
    expect(screen.queryByText('dashboard raw')).not.toBeInTheDocument();

    expect(mockedVideoPlayer).toHaveBeenCalledTimes(1);
    expect(mockedVideoPlayer).toHaveBeenCalledWith(
      {
        defaultVolume: 0,
        video,
        playerType: 'videojs',
        timedTextTracks: [],
      },
      {},
    );

    expect(mockedDashboardRaw).not.toHaveBeenCalled();
  });

  it('renders the dashboard', () => {
    const video = videoMockFactory();

    render(
      <LiveFeedbackProvider value={false}>
        <TeacherLiveRawWrapper video={video} />
      </LiveFeedbackProvider>,
    );

    expect(screen.queryByText('videojs player')).not.toBeInTheDocument();
    screen.getByText('dashboard raw');

    expect(mockedVideoPlayer).not.toHaveBeenCalled();

    expect(mockedDashboardRaw).toHaveBeenCalledTimes(1);
    expect(mockedDashboardRaw).toHaveBeenCalledWith(
      {
        video,
      },
      {},
    );
  });
});

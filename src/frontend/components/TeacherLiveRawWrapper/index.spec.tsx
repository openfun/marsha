import { render, screen } from '@testing-library/react';
import React from 'react';

import VideoPlayer from 'components/VideoPlayer';
import { LiveFeedbackProvider } from 'data/stores/useLiveFeedback';
import { videoMockFactory } from 'utils/tests/factories';

import TeacherLiveRawWrapper from '.';
import DashboardVideoLiveRaw from 'components/DashboardVideoLiveRaw';

jest.mock('components/VideoPlayer', () =>
  jest.fn().mockImplementation((_: any) => <span>videojs player</span>),
);
const mockedVideoPlayer = VideoPlayer as jest.MockedFunction<
  typeof VideoPlayer
>;

jest.mock('components/DashboardVideoLiveRaw', () =>
  jest.fn().mockImplementation((_: any) => <span>dashboard raw</span>),
);
const mockedDashboardRaw = DashboardVideoLiveRaw as jest.MockedFunction<
  typeof DashboardVideoLiveRaw
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

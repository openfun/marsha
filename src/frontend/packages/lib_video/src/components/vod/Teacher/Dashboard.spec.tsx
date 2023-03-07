/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  liveState,
  uploadState,
  useJwt,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { VideoWidgetProvider } from 'components/common';

import { Dashboard } from './Dashboard';

const mockedVideo = videoMockFactory({
  id: 'video_id',
  title: 'Title of the video',
  description: 'An example description',
  live_state: null,
  upload_state: uploadState.READY,
});

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'https://liveBackground.com/liveBackgroung.png',
      },
    },
  }),
  decodeJwt: () => ({}),
}));

jest.mock('utils/websocket', () => ({
  initWebsocket: jest.fn().mockImplementation(() => ({
    addEventListener: () => {},
    close: () => {},
    removeEventListener: () => {},
  })),
}));

jest.mock('components/common/VideoWidgetProvider', () => ({
  VideoWidgetProvider: jest.fn(() => <p>VideoWidgetProvider</p>),
}));
const mockedVideoWidgetProvider = VideoWidgetProvider as jest.MockedFunction<
  typeof VideoWidgetProvider
>;

const languageChoices = [
  { display_name: 'English', value: 'en' },
  { display_name: 'French', value: 'fr' },
];

describe('<Dashboard />', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
    fetchMock.mock(
      `/api/timedtexttracks/`,
      {
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders the DashboardVOD with stats tab if video does not come from a live session', () => {
    const { container } = render(
      <Dashboard video={mockedVideo} socketUrl="some_url" />,
    );
    // Video
    const videoElement = container.getElementsByTagName('video')[0]!;
    expect(videoElement).toHaveAttribute(
      'poster',
      'https://example.com/default_thumbnail/1080',
    );
    expect(videoElement.getElementsByTagName('source')).toHaveLength(5);

    // show dashboard
    userEvent.click(
      screen.getByRole('button', { name: `${mockedVideo.title!} dashboard` }),
    );
    // TeacherLiveInfoBar
    screen.getByDisplayValue('Title of the video');

    // DashboardControlPane
    screen.getByRole('tab', { name: 'configuration' });
    screen.getByRole('tab', { name: 'statistics' });

    // VideoWidgetProvider
    screen.getByText('VideoWidgetProvider');
  });

  it('renders the DashboardVOD with tabs if video comes from a live session', () => {
    const mockedLiveVideo = videoMockFactory({
      id: 'video_id',
      title: 'Title of the video',
      description: 'An example description',
      live_state: liveState.ENDED,
    });

    const { container } = render(
      <Dashboard video={mockedLiveVideo} socketUrl="some_url" />,
      {
        intlOptions: { locale: 'en-US' },
      },
    );

    // Video
    const videoElement = container.getElementsByTagName('video')[0]!;
    expect(videoElement).toHaveAttribute(
      'poster',
      'https://example.com/default_thumbnail/1080',
    );
    expect(videoElement.getElementsByTagName('source')).toHaveLength(5);

    // show dashboard
    userEvent.click(
      screen.getByRole('button', { name: `${mockedVideo.title!} dashboard` }),
    );
    // TeacherLiveInfoBar
    screen.getByDisplayValue('Title of the video');

    // DashboardControlPane
    screen.getByRole('tab', { name: 'configuration' });
    screen.getByRole('tab', { name: 'attendances' });

    // VideoWidgetProvider
    screen.getByText('VideoWidgetProvider');
    expect(mockedVideoWidgetProvider).toHaveBeenCalledWith(
      {
        isLive: false,
        isTeacher: true,
      },
      {},
    );
  });
});

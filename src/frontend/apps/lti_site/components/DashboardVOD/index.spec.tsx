import { screen } from '@testing-library/react';
import { liveState, useJwt, videoMockFactory } from 'lib-components';
import React from 'react';

import { useTimedTextTrackLanguageChoices } from 'data/stores/useTimedTextTrackLanguageChoices';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';
import { DashboardVOD } from '.';

const mockedVideo = videoMockFactory({
  id: 'video_id',
  title: 'Title of the video',
  description: 'An example description',
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

jest.mock('components/VideoWidgetProvider', () => ({
  VideoWidgetProvider: () => <p>VideoWidgetProvider</p>,
}));

const languageChoices = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
];

describe('<DashboardVOD />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
    });
  });

  it('renders the DashboardVOD without tabs if video does not come from a live session', () => {
    useTimedTextTrackLanguageChoices.setState({
      choices: languageChoices,
    });

    const { container } = render(wrapInVideo(<DashboardVOD />, mockedVideo));

    // Video
    const videoElement = container.getElementsByTagName('video')[0]!;
    expect(videoElement).toHaveAttribute(
      'poster',
      'https://example.com/default_thumbnail/1080',
    );
    expect(videoElement.getElementsByTagName('source')).toHaveLength(5);

    // TeacherLiveInfoBar
    screen.getByRole('heading', { name: 'Title of the video' });

    // DashboardControlPane
    expect(
      screen.queryByRole('tab', { name: 'configuration' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: 'attendances' }),
    ).not.toBeInTheDocument();

    // VideoWidgetProvider
    screen.getByText('VideoWidgetProvider');
  });

  it('renders the DashboardVOD with tabs if video comes from a live session', () => {
    useTimedTextTrackLanguageChoices.setState({
      choices: languageChoices,
    });

    const mockedLiveVideo = videoMockFactory({
      id: 'video_id',
      title: 'Title of the video',
      description: 'An example description',
      live_state: liveState.ENDED,
    });

    const { container } = render(
      wrapInVideo(<DashboardVOD />, mockedLiveVideo),
    );

    // Video
    const videoElement = container.getElementsByTagName('video')[0]!;
    expect(videoElement).toHaveAttribute(
      'poster',
      'https://example.com/default_thumbnail/1080',
    );
    expect(videoElement.getElementsByTagName('source')).toHaveLength(5);

    // TeacherLiveInfoBar
    screen.getByRole('heading', { name: 'Title of the video' });

    // DashboardControlPane
    screen.getByRole('tab', { name: 'configuration' });
    screen.getByRole('tab', { name: 'attendances' });

    // VideoWidgetProvider
    screen.getByText('VideoWidgetProvider');
  });
});

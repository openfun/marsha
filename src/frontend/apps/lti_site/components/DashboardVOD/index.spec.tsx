import { screen } from '@testing-library/react';
import { useJwt, videoMockFactory } from 'lib-components';
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

  it('renders the DashboardVOD', () => {
    useTimedTextTrackLanguageChoices.setState({
      choices: languageChoices,
    });

    const { container } = render(wrapInVideo(<DashboardVOD />, mockedVideo), {
      intlOptions: { locale: 'en-US' },
    });

    // Video
    const videoElement = container.getElementsByTagName('video')[0]!;
    expect(videoElement).toHaveAttribute(
      'poster',
      'https://example.com/default_thumbnail/1080',
    );
    expect(videoElement.getElementsByTagName('source')).toHaveLength(5);

    // TeacherLiveInfoBar
    screen.getByRole('heading', { name: 'Title of the video' });

    screen.getByText('VideoWidgetProvider');
  });
});

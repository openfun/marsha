import { screen } from '@testing-library/react';
import React from 'react';

import { useJwt } from 'data/stores/useJwt';
import { useTimedTextTrackLanguageChoices } from 'data/stores/useTimedTextTrackLanguageChoices';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';
import { DashboardVOD } from '.';

const mockedVideo = videoMockFactory({
  id: 'video_id',
  title: 'Title of the video',
  description: 'An example description',
});

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'https://liveBackground.com/liveBackgroung.png',
      },
    },
  }),
}));

jest.mock('./widgets/DashboardVODWidgetGeneralTitle', () => ({
  DashboardVODWidgetGeneralTitle: () => <p>DashboardVODWidgetGeneralTitle</p>,
}));
jest.mock('./widgets/DashboardVODWidgetUploadVideo', () => ({
  DashboardVODWidgetUploadVideo: () => <p>DashboardVODWidgetUploadVideo</p>,
}));
jest.mock(
  'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetThumbnail',
  () => ({
    DashboardVideoLiveWidgetThumbnail: (props: { isLive: boolean }) => (
      <p>{`DashboardVideoLiveWidgetThumbnail ${props.isLive}`}</p>
    ),
  }),
);
jest.mock('./widgets/DashboardVODWidgetDownloadVideo', () => ({
  DashboardVODWidgetDownloadVideo: () => <p>DashboardVODWidgetDownloadVideo</p>,
}));
jest.mock('./widgets/DashboardVODWidgetUploadSubtitles', () => ({
  DashboardVODWidgetUploadSubtitles: () => (
    <p>DashboardVODWidgetUploadSubtitles</p>
  ),
}));
jest.mock('./widgets/DashboardVODWidgetUploadTranscripts', () => ({
  DashboardVODWidgetUploadTranscripts: () => (
    <p>DashboardVODWidgetUploadTranscripts</p>
  ),
}));
jest.mock('./widgets/DashboardVODWidgetUploadClosedCaptions', () => ({
  DashboardVODWidgetUploadClosedCaptions: () => (
    <p>DashboardVODWidgetUploadClosedCaptions</p>
  ),
}));

const languageChoices = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
];

describe('<DashboardVOD />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () => ({ locale: 'en_US' } as any),
    });
  });

  it('renders the DashboardVOD', () => {
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

    // DashboardVODWidgetGeneralTitle
    screen.getByText('DashboardVODWidgetGeneralTitle');

    // DashboardVODWidgetUploadVideo
    screen.getByText('DashboardVODWidgetUploadVideo');

    // DashboardVideoLiveWidgetThumbnail
    screen.getByText('DashboardVideoLiveWidgetThumbnail false');

    // DashboardVODWidgetDownloadVideo
    screen.getByText('DashboardVODWidgetDownloadVideo');

    // DashboardVODWidgetUploadSubtitles
    screen.getByText('DashboardVODWidgetUploadSubtitles');

    // DashboardVODWidgetUploadTranscripts
    screen.getByText('DashboardVODWidgetUploadTranscripts');

    // DashboardVODWidgetUploadClosedCaptions
    screen.getByText('DashboardVODWidgetUploadClosedCaptions');
  });
});

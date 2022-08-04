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

jest.mock('./widgets/GeneralTitle', () => ({
  GeneralTitle: () => <p>GeneralTitle</p>,
}));
jest.mock('./widgets/UploadVideo', () => ({
  UploadVideo: () => <p>UploadVideo</p>,
}));
jest.mock('components/common/dashboard/widgets/WidgetThumbnail', () => ({
  WidgetThumbnail: (props: { isLive: boolean }) => (
    <p>{`WidgetThumbnail ${props.isLive}`}</p>
  ),
}));
jest.mock('./widgets/DownloadVideo', () => ({
  DownloadVideo: () => <p>DownloadVideo</p>,
}));
jest.mock('./widgets/UploadSubtitles', () => ({
  UploadSubtitles: () => <p>UploadSubtitles</p>,
}));
jest.mock('./widgets/UploadTranscripts', () => ({
  UploadTranscripts: () => <p>UploadTranscripts</p>,
}));
jest.mock('./widgets/UploadClosedCaptions', () => ({
  UploadClosedCaptions: () => <p>UploadClosedCaptions</p>,
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

    // GeneralTitle
    screen.getByText('GeneralTitle');

    // UploadVideo
    screen.getByText('UploadVideo');

    // WidgetThumbnail
    screen.getByText('WidgetThumbnail false');

    // DownloadVideo
    screen.getByText('DownloadVideo');

    // UploadSubtitles
    screen.getByText('UploadSubtitles');

    // UploadTranscripts
    screen.getByText('UploadTranscripts');

    // UploadClosedCaptions
    screen.getByText('UploadClosedCaptions');
  });
});

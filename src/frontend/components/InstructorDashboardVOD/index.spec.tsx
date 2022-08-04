import { screen } from '@testing-library/react';
import React from 'react';

import { useJwt } from 'data/stores/useJwt';
import { useTimedTextTrackLanguageChoices } from 'data/stores/useTimedTextTrackLanguageChoices';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';
import { InstructorDashboardVOD } from '.';

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

jest.mock('./widgets/InstructorDashboardVODWidgetGeneralTitle', () => ({
  InstructorDashboardVODWidgetGeneralTitle: () => (
    <p>InstructorDashboardVODWidgetGeneralTitle</p>
  ),
}));
jest.mock('./widgets/InstructorDashboardVODWidgetUploadVideo', () => ({
  InstructorDashboardVODWidgetUploadVideo: () => (
    <p>InstructorDashboardVODWidgetUploadVideo</p>
  ),
}));
jest.mock(
  'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetThumbnail',
  () => ({
    DashboardVideoLiveWidgetThumbnail: (props: { isLive: boolean }) => (
      <p>{`DashboardVideoLiveWidgetThumbnail ${props.isLive}`}</p>
    ),
  }),
);

const languageChoices = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
];

describe('<InstructorDashboardVOD />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () => ({ locale: 'en_US' } as any),
    });
  });

  it('renders the InstructorDashboardVOD', () => {
    useTimedTextTrackLanguageChoices.setState({
      choices: languageChoices,
    });

    const { container } = render(
      wrapInVideo(<InstructorDashboardVOD />, mockedVideo),
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

    // InstructorDashboardVODWidgetGeneralTitle
    screen.getByText('InstructorDashboardVODWidgetGeneralTitle');

    // InstructorDashboardVODWidgetUploadVideo
    screen.getByText('InstructorDashboardVODWidgetUploadVideo');

    // DashboardVideoLiveWidgetThumbnail
    screen.getByText('DashboardVideoLiveWidgetThumbnail false');

    // InstructorDashboardVODWidgetDownloadVideo
    screen.getByText('InstructorDashboardVODWidgetDownloadVideo');
  });
});

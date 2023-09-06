import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import {
  JoinMode,
  TimedTextTranscript,
  Video,
  liveState,
  sharedLiveMediaMockFactory,
  thumbnailMockFactory,
  timedTextMockFactory,
  timedTextMode,
  uploadState,
  useCurrentResourceContext,
  useJwt,
  useSharedLiveMedia,
  useThumbnail,
  useTimedTextTrack,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import { DateTime } from 'luxon';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { VideoWidgetProvider } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    static: { img: { liveBackground: 'some_url' } },
  }),
  useCurrentResourceContext: jest.fn(),
}));

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;
const currentDate = DateTime.fromISO('2022-01-13T12:00');

const languageChoices = [
  { display_name: 'some_language_label', value: 'some_language' },
];

const videoId = faker.datatype.uuid();

describe('<VideoWidgetProvider />', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');

    fetchMock.mock(
      `/api/videos/${videoId}/timedtexttracks/`,
      {
        actions: {
          POST: {
            language: {
              choices: languageChoices,
            },
          },
        },
      },
      { method: 'OPTIONS' },
    );

    fetchMock.mock(
      `/api/videos/${videoId}/thumbnails/`,
      {
        upload_max_size_bytes: 1000000,
      },
      { method: 'OPTIONS' },
    );

    fetchMock.mock(
      `/api/videos/${videoId}/`,
      {
        ok: true,
      },
      { method: 'PATCH' },
    );
  });

  afterEach(() => fetchMock.restore());

  describe('renders widgets for live teacher', () => {
    let mockVideo: Video;
    beforeEach(() => {
      mockedUseCurrentResourceContext.mockReturnValue([
        {
          permissions: {
            can_access_dashboard: true,
            can_update: true,
          },
        },
      ] as any);
      const mockedThumbnail = thumbnailMockFactory({
        video: videoId,
        is_ready_to_show: true,
      });
      const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
        title: 'Title of the file',
        video: videoId,
      });
      mockVideo = videoMockFactory({
        id: videoId,
        title: 'An example title',
        allow_recording: false,
        is_public: true,
        join_mode: JoinMode.APPROVAL,
        starting_at: currentDate.toString(),
        estimated_duration: '00:30',
        description: 'An example description',
        thumbnail: mockedThumbnail,
        shared_live_medias: [mockedSharedLiveMedia],
        live_state: liveState.RUNNING,
      });

      useThumbnail.getState().addResource(mockedThumbnail);
      useSharedLiveMedia.getState().addResource(mockedSharedLiveMedia);
    });

    afterEach(() => {
      jest.clearAllMocks();
      fetchMock.restore();
    });

    it('tests ToolsAndApplications', async () => {
      render(wrapInVideo(<VideoWidgetProvider isLive isTeacher />, mockVideo));

      await screen.findByText('Tools and applications');
      const hasChatToggleButton = screen.getByRole('checkbox', {
        name: 'Activate chat',
      });
      expect(hasChatToggleButton).toBeChecked();
      screen.getByText('Activate chat');
      const liveRecordingToggleButton = screen.getByRole('checkbox', {
        name: 'Activate live recording',
      });
      expect(liveRecordingToggleButton).not.toBeChecked();
      screen.getByText('Activate live recording');
    });

    it('tests VisibilityAndInteraction', async () => {
      render(wrapInVideo(<VideoWidgetProvider isLive isTeacher />, mockVideo));

      await screen.findByText('Visibility and interaction parameters');
      const visibilityToggleButton = screen.getByRole('checkbox', {
        name: 'Make the video publicly available',
      });
      expect(visibilityToggleButton).toBeChecked();
      screen.getByText('Make the video publicly available');
      screen.getByText('https://localhost/videos/'.concat(mockVideo.id));
      screen.getByRole('button', {
        name: 'Public link:',
      });
    });

    it('tests DashboardLiveTabConfigurationchedulingAndDescription', async () => {
      render(wrapInVideo(<VideoWidgetProvider isLive isTeacher />, mockVideo));

      await screen.findByText('Description');

      const inputStartingAtDate = within(
        screen.getByTestId('starting-at-date-picker'),
      ).getByRole('presentation');
      expect(inputStartingAtDate).toHaveTextContent('1/13/2022');

      const inputStartingAtTime = screen.getByLabelText(/starting time/i);
      expect(inputStartingAtTime).toHaveValue('12:00');
      const inputEstimatedDuration =
        screen.getByLabelText(/estimated duration/i);
      expect(inputEstimatedDuration).toHaveValue('0:30');
      screen.getByText("Webinar's end");
      screen.getByText('2022/01/13, 12:30');
      const textArea = screen.getByRole('textbox', {
        name: 'Description...',
      });
      expect(textArea).toHaveValue('An example description');
      expect(screen.getByText('Description...')).toBeInTheDocument();
    });

    it('tests LivePairing', async () => {
      render(wrapInVideo(<VideoWidgetProvider isLive isTeacher />, mockVideo));

      // LivePairing
      const openButton = await screen.findByRole('button', {
        name: 'External broadcast sources',
      });
      await userEvent.click(openButton);
      expect(
        screen.getByRole('button', {
          name: /pair an external device/i,
        }),
      ).toBeInTheDocument();
    });

    it('tests DashboardLiveTabConfigurationharedLiveMedia', async () => {
      render(wrapInVideo(<VideoWidgetProvider isLive isTeacher />, mockVideo));

      await screen.findByText('Supports sharing');
      screen.getByRole('button', {
        name: 'Upload a presentation support',
      });
      screen.getByRole('button', {
        name: 'Click on this button to stop allowing students to download this media.',
      });
      screen.getByRole('button', { name: 'Share' });
      screen.getByRole('link', { name: 'Title of the file' });
      expect(
        screen.getByRole('button', {
          name: 'Click on this button to delete the media.',
        }),
      ).toBeInTheDocument();
    });

    it('tests VODCreation', async () => {
      render(wrapInVideo(<VideoWidgetProvider isLive isTeacher />, mockVideo));

      expect(
        await screen.findByText(/There is nothing to harvest/),
      ).toBeInTheDocument();
    });

    it('tests JoinMode', async () => {
      render(wrapInVideo(<VideoWidgetProvider isLive isTeacher />, mockVideo));

      await screen.findByText('Join the discussion');
      const button = screen.getByRole('button', {
        name: /select join the discussion mode/i,
      });
      const select = within(button).getByRole('textbox');
      expect(select).toHaveValue(
        'Accept joining the discussion after approval',
      );
    });

    it('tests DashboardLiveWidgetThumbnail', async () => {
      render(wrapInVideo(<VideoWidgetProvider isLive isTeacher />, mockVideo));

      // DashboardLiveWidgetThumbnail
      await screen.findByText('Thumbnail');
      const img = screen.getByRole('img', { name: 'Live video thumbnail' });
      expect(img.getAttribute('src')).toEqual(
        'https://example.com/default_thumbnail/144',
      );
      expect(img.getAttribute('srcset')).toEqual(
        'https://example.com/default_thumbnail/144 256w, https://example.com/default_thumbnail/240 426w, https://example.com/default_thumbnail/480 854w, https://example.com/default_thumbnail/720 1280w, https://example.com/default_thumbnail/1080 1920w',
      );
      screen.getByRole('button', { name: 'Delete thumbnail' });
      screen.getByRole('button', { name: 'Upload an image' });
    });
  });

  it('renders widget for vod teacher', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const mockedThumbnail = thumbnailMockFactory({
      video: videoId,
      is_ready_to_show: true,
    });
    const mockVideo = videoMockFactory({
      id: videoId,
      title: 'An example title',
      allow_recording: false,
      is_public: true,
      join_mode: JoinMode.APPROVAL,
      starting_at: currentDate.toString(),
      estimated_duration: '00:30',
      description: 'An example description',
      thumbnail: mockedThumbnail,
    });
    fetchMock.mock(
      `/api/videos/`,
      {
        actions: { POST: { license: { options: [] } } },
      },
      { method: 'OPTIONS' },
    );

    useThumbnail.getState().addResource(mockedThumbnail);

    useJwt.setState({
      getDecodedJwt: () => ({ locale: 'en' }) as any,
    });

    render(
      wrapInVideo(<VideoWidgetProvider isLive={false} isTeacher />, mockVideo),
    );

    //  Upload video
    expect(await screen.findByText('Video')).toBeInTheDocument();

    //  Download video
    expect(screen.getByText('Download video')).toBeInTheDocument();

    //  Subtitle
    expect(screen.getByText('Subtitles')).toBeInTheDocument();

    //  Transcripts
    expect(screen.getByText('Transcripts')).toBeInTheDocument();

    //  Closed captions
    expect(screen.getByText('Closed captions')).toBeInTheDocument();

    // License Manager
    expect(screen.getByText('License')).toBeInTheDocument();

    // visibility
    expect(
      screen.getByText('Visibility and interaction parameters'),
    ).toBeInTheDocument();
  });

  it('renders widget for vod student', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    useTimedTextTrack.getState().addResource({
      active_stamp: 234243242353,
      id: '1',
      is_ready_to_show: true,
      language: 'fr',
      mode: timedTextMode.TRANSCRIPT,
      title: 'foo',
      upload_state: uploadState.READY,
      source_url: 'https://example.com/vtt/fr',
      url: 'https://example.com/vtt/fr.vtt',
      video: videoId,
    });
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      title: 'Title of the file',
      video: videoId,
    });
    const mockedThumbnail = thumbnailMockFactory({
      video: videoId,
      is_ready_to_show: true,
    });
    const mockVideo = videoMockFactory({
      id: videoId,
      title: 'An example title',
      allow_recording: false,
      is_public: true,
      join_mode: JoinMode.APPROVAL,
      starting_at: currentDate.toString(),
      estimated_duration: '00:30',
      description: 'An example description',
      thumbnail: mockedThumbnail,
      has_transcript: true,
      shared_live_medias: [mockedSharedLiveMedia],
    });

    useThumbnail.getState().addResource(mockedThumbnail);
    useSharedLiveMedia.getState().addResource(mockedSharedLiveMedia);

    useJwt.setState({
      getDecodedJwt: () => ({ locale: 'en' }) as any,
    });

    render(
      wrapInVideo(
        <VideoWidgetProvider isLive={false} isTeacher={false} />,
        mockVideo,
      ),
    );

    //  Download video as student should not appear in the widgets
    expect(screen.queryByText('Download video')).not.toBeInTheDocument();

    //  Transcripts should not be displayed by default
    expect(screen.queryByText('Transcripts')).not.toBeInTheDocument();

    const timedTextMock = timedTextMockFactory({
      language: 'fr',
      is_ready_to_show: true,
      mode: timedTextMode.TRANSCRIPT,
    }) as TimedTextTranscript;

    fetchMock.mock(timedTextMock.url, {
      ok: true,
    });

    act(() => {
      useTimedTextTrack.getState().setSelectedTranscript(timedTextMock);
    });

    await waitFor(() => {
      expect(screen.getByText('Transcripts')).toBeInTheDocument();
    });

    // Media sharing
    expect(screen.queryByText('Supports sharing')).not.toBeInTheDocument();
  });
});

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  UploadManagerContext,
  UploadManagerStatus,
  UploadingObject,
  modelName,
  timedTextMode,
  uploadState,
  useFlags,
  useJwt,
  useTimedTextTrack,
  useUploadManager,
} from 'lib-components';
import { timedTextMockFactory, videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import { PropsWithChildren } from 'react';

import { createTimedTextTrack } from '@lib-video/api/createTimedTextTrack';
import { DeleteTimedTextTrackUploadModalProvider } from '@lib-video/hooks/useDeleteTimedTextTrackUploadModal';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { LocalizedTimedTextTrackUpload } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: jest.fn(),
  useUploadManager: jest.fn(),
  UploadManagerContext: {
    Provider: ({ children }: PropsWithChildren<{}>) => children,
  },
  report: jest.fn(),
}));

const mockUseUploadManager = useUploadManager as jest.MockedFunction<
  typeof useUploadManager
>;

jest.mock('api/createTimedTextTrack', () => ({
  createTimedTextTrack: jest.fn(),
}));
const mockCreateTimedTextTrack = createTimedTextTrack as jest.MockedFunction<
  typeof createTimedTextTrack
>;

const languageChoices = [
  { display_name: 'English', value: 'en' },
  { display_name: 'French', value: 'fr' },
  { display_name: 'Spanish', value: 'es' },
  { display_name: 'Slovenian', value: 'sl' },
  { display_name: 'Swedish', value: 'sv' },
];

describe('<LocalizedTimedTextTrackUpload />', () => {
  jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

  beforeEach(() => {
    useJwt.setState({
      jwt: 'jsonWebToken',
    });
    jest.clearAllMocks();
    fetchMock.restore();
    useFlags.getState().setFlags({
      transcription: false,
    });
  });

  it('renders the component without any uploaded timed text track', async () => {
    const mockedVideo = videoMockFactory({
      id: '1234',
    });
    fetchMock.mock(
      `/api/videos/1234/timedtexttracks/`,
      {
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    render(
      wrapInVideo(
        <LocalizedTimedTextTrackUpload
          timedTextModeWidget={timedTextMode.SUBTITLE}
        />,
        mockedVideo,
      ),
      { intlOptions: { locale: 'fr-FR' } },
    );

    const button = await screen.findByRole('combobox', {
      name: 'Choose the language',
    });
    expect(await within(button).findByText('French')).toBeInTheDocument();
    screen.getByText('No uploaded files');

    screen.getByRole('button', { name: 'Upload file' });
  });

  it('uploads a timed text track', async () => {
    const mockedVideo = videoMockFactory({
      id: '4321',
    });
    fetchMock.mock(
      `/api/videos/4321/timedtexttracks/`,
      {
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );

    const mockTimedTextTrack = {
      title: 'title',
      id: 'timedTextTrack_id',
      active_stamp: null,
      is_ready_to_show: false,
      language: 'fr',
      mode: timedTextMode.SUBTITLE,
      upload_state: uploadState.PENDING,
      source_url: 'source_url',
      url: 'url',
      video: mockedVideo.id,
    };

    useFlags.getState().setFlags({
      transcription: true,
    });

    mockCreateTimedTextTrack.mockImplementation(() =>
      Promise.resolve(mockTimedTextTrack),
    );

    const mockAddUpload = jest.fn();
    mockUseUploadManager.mockReturnValue({
      addUpload: mockAddUpload,
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    render(
      wrapInVideo(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <LocalizedTimedTextTrackUpload
            timedTextModeWidget={timedTextMode.SUBTITLE}
          />
        </UploadManagerContext.Provider>,
        mockedVideo,
      ),
      { intlOptions: { locale: 'fr-FR' } },
    );

    const uploadButton = await screen.findByRole('button', {
      name: 'Upload file',
    });
    await userEvent.click(uploadButton);
    const hiddenInput = screen.getByTestId('input-file-test-id');
    const file = new File(['(⌐□_□)'], 'subtitle.vtt', {
      type: 'application',
    });
    await userEvent.upload(hiddenInput, file);
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/4321/timedtexttracks/`,
    );
    await waitFor(() =>
      expect(mockAddUpload).toHaveBeenLastCalledWith(
        modelName.TIMEDTEXTTRACKS,
        mockTimedTextTrack.id,
        file,
        mockedVideo.id,
        expect.any(Function),
      ),
    );
  });

  it('fails to upload a timed text track when the file is too large and displays an error message', async () => {
    const mockedVideo = videoMockFactory({
      id: '7894',
    });

    mockCreateTimedTextTrack.mockRejectedValue({
      size: ['File too large !'],
    });

    fetchMock.mock(
      `/api/videos/7894/timedtexttracks/`,
      {
        upload_max_size_bytes: Math.pow(10, 9),
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );

    render(
      wrapInVideo(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <LocalizedTimedTextTrackUpload
            timedTextModeWidget={timedTextMode.SUBTITLE}
          />
        </UploadManagerContext.Provider>,
        mockedVideo,
      ),
      { intlOptions: { locale: 'fr-FR' } },
    );

    const uploadButton = await screen.findByRole('button', {
      name: 'Upload file',
    });
    await userEvent.click(uploadButton);
    const hiddenInput = screen.getByTestId('input-file-test-id');
    const file = new File(['(⌐□_□)'], 'subtitle.vtt', {
      type: 'application',
    });
    await userEvent.upload(hiddenInput, file);

    expect(fetchMock.calls()).toHaveLength(1);
    expect(screen.queryByText('subs.srt')).not.toBeInTheDocument();
    expect(
      await screen.findByText('Uploaded files exceeds allowed size of 1 GB.'),
    ).toBeInTheDocument();
  });

  it('renders the component with several uploaded and uploading timed text track', async () => {
    const mockedVideo = videoMockFactory({
      id: '4466',
    });

    fetchMock.mock(
      `/api/videos/4466/timedtexttracks/`,
      {
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );

    const mockedTimedTextTrackUploading = timedTextMockFactory({
      language: 'fr-FR',
      upload_state: uploadState.PENDING,
    });

    const mockedUploadingObject: UploadingObject = {
      file: new File([], 'subtitle.srt'),
      objectType: modelName.TIMEDTEXTTRACKS,
      status: UploadManagerStatus.UPLOADING,
      objectId: mockedTimedTextTrackUploading.id,
      progress: 50,
    };

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {
        [mockedTimedTextTrackUploading.id]: mockedUploadingObject,
      },
    });

    const mockedTimedTextTrackProcessing = timedTextMockFactory({
      language: 'en-EN',
      upload_state: uploadState.PROCESSING,
    });

    const mockedTimedTextTrackCompleted = timedTextMockFactory({
      language: 'es-ES',
    });

    useTimedTextTrack.getState().addResource(mockedTimedTextTrackUploading);
    useTimedTextTrack.getState().addResource(mockedTimedTextTrackProcessing);
    useTimedTextTrack.getState().addResource(mockedTimedTextTrackCompleted);

    render(
      wrapInVideo(
        <DeleteTimedTextTrackUploadModalProvider value={null}>
          <LocalizedTimedTextTrackUpload
            timedTextModeWidget={timedTextMode.SUBTITLE}
          />
          ,
        </DeleteTimedTextTrackUploadModalProvider>,
        mockedVideo,
      ),
      { intlOptions: { locale: 'fr-FR' } },
    );

    await screen.findByText('French');
    screen.getByText('Uploading');
    screen.getByText('English');
    screen.getByText('Processing');
    screen.getByText('Spanish');
    screen.getByText('Uploading');

    expect(
      screen.getAllByRole('button', {
        name: 'Click on this button to delete the timed text track.',
      }),
    ).toHaveLength(3);
  });

  it('renders a generate transcription button in transcript mode if none exists', async () => {
    const mockedVideo = videoMockFactory({
      id: '1234',
    });
    fetchMock.mock(`/api/videos/1234/initiate-transcript/`, {
      method: 'POST',
    });
    fetchMock.mock(
      `/api/videos/1234/timedtexttracks/`,
      {
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );

    useFlags.getState().setFlags({
      transcription: true,
    });

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    render(
      wrapInVideo(
        <LocalizedTimedTextTrackUpload
          timedTextModeWidget={timedTextMode.TRANSCRIPT}
        />,
        mockedVideo,
      ),
      { intlOptions: { locale: 'fr-FR' } },
    );

    const generateTranscriptButton = await screen.findByRole('button', {
      name: 'Generate transcript',
    });
    await userEvent.click(generateTranscriptButton);

    screen.getByText(
      "By clicking this button, a transcript will be automatically generated. The transcript's language will be the one detected in the video.",
    );

    expect(fetchMock.calls()).toHaveLength(2);
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/1234/initiate-transcript/`,
    );
  });

  it('does not render a generate transcription button in transcript mode if one exists', () => {
    const mockedVideo = videoMockFactory({
      id: '1234',
    });
    fetchMock.mock(
      `/api/videos/1234/timedtexttracks/`,
      {
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );
    useFlags.getState().setFlags({
      transcription: true,
    });

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    const mockedTimedTextTrackCompleted = timedTextMockFactory({
      language: 'es-ES',
      mode: timedTextMode.TRANSCRIPT,
    });
    useTimedTextTrack.getState().addResource(mockedTimedTextTrackCompleted);

    render(
      wrapInVideo(
        <DeleteTimedTextTrackUploadModalProvider value={null}>
          <LocalizedTimedTextTrackUpload
            timedTextModeWidget={timedTextMode.SUBTITLE}
          />
          ,
        </DeleteTimedTextTrackUploadModalProvider>,
        mockedVideo,
      ),
      { intlOptions: { locale: 'fr-FR' } },
    );

    expect(
      screen.queryByRole('button', { name: 'Generate transcript' }),
    ).not.toBeInTheDocument();
  });

  it('does not render a generate transcription button in subtitle mode', () => {
    const mockedVideo = videoMockFactory({
      id: '1234',
    });
    fetchMock.mock(
      `/api/videos/1234/timedtexttracks/`,
      {
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );
    useFlags.getState().setFlags({
      transcription: true,
    });

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    render(
      wrapInVideo(
        <LocalizedTimedTextTrackUpload
          timedTextModeWidget={timedTextMode.SUBTITLE}
        />,
        mockedVideo,
      ),
      { intlOptions: { locale: 'fr-FR' } },
    );

    expect(
      screen.queryByRole('button', { name: 'Generate transcript' }),
    ).not.toBeInTheDocument();
  });

  it('does not render a generate transcription button in closed captions mode', () => {
    const mockedVideo = videoMockFactory({
      id: '1234',
    });
    fetchMock.mock(
      `/api/videos/1234/timedtexttracks/`,
      {
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    useFlags.getState().setFlags({
      transcription: true,
    });

    render(
      wrapInVideo(
        <LocalizedTimedTextTrackUpload
          timedTextModeWidget={timedTextMode.CLOSED_CAPTIONING}
        />,
        mockedVideo,
      ),
      { intlOptions: { locale: 'fr-FR' } },
    );

    expect(
      screen.queryByRole('button', { name: 'Generate transcript' }),
    ).not.toBeInTheDocument();
  });

  it('does not render a generate transcription button in transcript mode if flag disabled', () => {
    const mockedVideo = videoMockFactory({
      id: '1234',
    });
    fetchMock.mock(`/api/videos/1234/initiate-transcript/`, {
      method: 'POST',
    });
    fetchMock.mock(
      `/api/videos/1234/timedtexttracks/`,
      {
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );

    useFlags.getState().setFlags({
      transcription: false,
    });

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    render(
      wrapInVideo(
        <LocalizedTimedTextTrackUpload
          timedTextModeWidget={timedTextMode.TRANSCRIPT}
        />,
        mockedVideo,
      ),
      { intlOptions: { locale: 'fr-FR' } },
    );
    expect(
      screen.queryByRole('button', { name: 'Generate transcript' }),
    ).not.toBeInTheDocument();
  });
});

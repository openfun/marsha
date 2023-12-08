/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  AppConfig,
  UploadManagerContext,
  UploadManagerStatus,
  modelName,
  uploadState,
  useAppConfig,
  useJwt,
  useUploadManager,
  useVideo,
  videoMockFactory,
} from 'lib-components';
import { Deferred, render } from 'lib-tests';
import { PropsWithChildren } from 'react';

import { CreateVOD } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: jest.fn(),
  report: jest.fn(),
  useVideo: jest.fn(),
  useUploadManager: jest.fn(),
  UploadManagerContext: {
    Provider: ({ children }: PropsWithChildren<{}>) => children,
  },
}));

const mockedUseAppConfig = useAppConfig as jest.MockedFunction<
  typeof useAppConfig
>;

const licenseChoices = [
  { display_name: 'Creative Common By Attribution', value: 'CC_BY' },
  {
    display_name: 'Creative Common By Attribution Share Alike',
    value: 'CC_BY-SA',
  },
  {
    display_name: 'Creative Common By Attribution Non Commercial No Derivates',
    value: 'CC_BY-NC-ND',
  },
  { display_name: 'Public Domain Dedication ', value: 'CC0' },
  { display_name: 'All rights reserved', value: 'NO_CC' },
];

URL.createObjectURL = () => '/blob/path/to/video';

const mockUseUploadManager = useUploadManager as jest.MockedFunction<
  typeof useUploadManager
>;

const mockedUseVideo = useVideo as jest.MockedFunction<typeof useVideo>;

describe('<CreateVOD />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
    jest.resetAllMocks();
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders CreateVOD with empty fields', async () => {
    const mockedVideo = videoMockFactory({
      id: 'videoId',
      title: null,
      description: null,
      upload_state: uploadState.PENDING,
      is_ready_to_show: false,
    });

    mockedUseVideo.mockReturnValue(mockedVideo);

    mockedUseAppConfig.mockReturnValue({
      static: {
        img: {
          videoWizardBackground: 'img/path/videoWizardBackground',
        },
      },
    } as any);

    fetchMock.mock(
      `/api/videos/`,
      {
        actions: { POST: { license: { choices: licenseChoices } } },
      },
      { method: 'OPTIONS' },
    );

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    const onUploadSuccess = jest.fn();
    const onPreviousButtonClick = jest.fn();

    render(
      <CreateVOD
        video={mockedVideo}
        onUploadSuccess={onUploadSuccess}
        onPreviousButtonClick={onPreviousButtonClick}
      />,
    );

    screen.getByText('Video creation');
    screen.getByText(
      'Use this wizard to create a new video, that you will be able to share with your students.',
    );

    screen.getByRole('textbox', { name: 'Enter title of your video here' });
    screen.getByText('Add a video or drag & drop it');
    screen.getByTestId('input-video-test-id');
    const rerenderedLicense = await screen.findByRole('combobox', {
      name: 'Select the license',
    });
    expect(
      await within(rerenderedLicense).findByText(
        'Creative Common By Attribution',
      ),
    ).toBeInTheDocument();

    const goBackButton = screen.getByRole('button', { name: 'Go back' });
    const createVideoButton = screen.getByRole('button', {
      name: 'Create a video',
    });
    expect(goBackButton).not.toBeDisabled();
    expect(createVideoButton).toBeDisabled();
    expect(onUploadSuccess).not.toHaveBeenCalled();
    expect(onPreviousButtonClick).not.toHaveBeenCalled();
  });

  it('renders CreateVOD with video title already set', async () => {
    const mockedVideo = videoMockFactory({
      id: 'videoId',
      title: 'Video title already set',
      description: null,
      upload_state: uploadState.PENDING,
      is_ready_to_show: false,
    });

    mockedUseVideo.mockReturnValue(mockedVideo);

    mockedUseAppConfig.mockReturnValue({
      static: {
        img: {
          videoWizardBackground: 'img/path/videoWizardBackground',
        },
      },
    } as AppConfig);

    fetchMock.mock(
      `/api/videos/`,
      {
        actions: { POST: { license: { choices: licenseChoices } } },
      },
      { method: 'OPTIONS' },
    );

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    const onUploadSuccess = jest.fn();
    const onPreviousButtonClick = jest.fn();

    render(
      <CreateVOD
        video={mockedVideo}
        onUploadSuccess={onUploadSuccess}
        onPreviousButtonClick={onPreviousButtonClick}
      />,
    );

    expect(screen.getByText('Video creation')).toBeInTheDocument();

    expect(
      screen.getByText(
        'Use this wizard to create a new video, that you will be able to share with your students.',
      ),
    ).toBeInTheDocument();

    const titleInput: HTMLInputElement = screen.getByRole('textbox', {
      name: 'Enter title of your video here',
    });
    expect(titleInput.value).toEqual(mockedVideo.title);
    expect(
      screen.getByText('Add a video or drag & drop it'),
    ).toBeInTheDocument();

    screen.getByTestId('input-video-test-id');
    const rerenderedLicense = await screen.findByRole('combobox', {
      name: 'Select the license',
    });
    expect(
      await within(rerenderedLicense).findByText(
        'Creative Common By Attribution',
      ),
    ).toBeInTheDocument();

    const goBackButton = screen.getByRole('button', { name: 'Go back' });
    const createVideoButton = screen.getByRole('button', {
      name: 'Create a video',
    });
    expect(goBackButton).not.toBeDisabled();
    expect(createVideoButton).toBeDisabled();
    expect(onUploadSuccess).not.toHaveBeenCalled();
    expect(onPreviousButtonClick).not.toHaveBeenCalled();
  });

  it('renders CreateVOD and clicks on go back button', async () => {
    const mockedVideo = videoMockFactory({
      id: 'videoId',
      title: null,
      description: null,
      upload_state: uploadState.PENDING,
      is_ready_to_show: false,
    });

    mockedUseVideo.mockReturnValue(mockedVideo);

    mockedUseAppConfig.mockReturnValue({
      static: {
        img: {
          videoWizardBackground: 'img/path/videoWizardBackground',
        },
      },
    } as any);

    fetchMock.mock(
      `/api/videos/`,
      {
        actions: { POST: { license: { choices: licenseChoices } } },
      },
      { method: 'OPTIONS' },
    );

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    const onUploadSuccess = jest.fn();
    const onPreviousButtonClick = jest.fn();

    render(
      <CreateVOD
        video={mockedVideo}
        onUploadSuccess={onUploadSuccess}
        onPreviousButtonClick={onPreviousButtonClick}
      />,
    );

    const goBackButton = screen.getByRole('button', { name: 'Go back' });
    await userEvent.click(goBackButton);

    expect(onUploadSuccess).not.toHaveBeenCalled();
    await waitFor(() => expect(onPreviousButtonClick).toHaveBeenCalled());
  });

  it('renders CreateVOD and tries to create video with completed fields', async () => {
    const mockedVideo = videoMockFactory({
      id: 'videoId',
      title: null,
      description: null,
      upload_state: uploadState.PENDING,
      is_ready_to_show: false,
    });

    mockedUseVideo.mockReturnValue(mockedVideo);

    mockedUseAppConfig.mockReturnValue({
      static: {
        img: {
          videoWizardBackground: 'img/path/videoWizardBackground',
        },
      },
    } as any);

    fetchMock.mock(
      `/api/videos/`,
      {
        actions: { POST: { license: { choices: licenseChoices } } },
      },
      { method: 'OPTIONS' },
    );

    const mockAddUpload = jest.fn();
    mockUseUploadManager.mockReturnValue({
      addUpload: mockAddUpload,
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    const deferred = new Deferred();
    fetchMock.mock(`/api/videos/${mockedVideo.id}/`, deferred.promise);

    const onUploadSuccess = jest.fn();
    const onPreviousButtonClick = jest.fn();

    const { container, rerender } = render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {},
        }}
      >
        <CreateVOD
          video={mockedVideo}
          onUploadSuccess={onUploadSuccess}
          onPreviousButtonClick={onPreviousButtonClick}
        />
      </UploadManagerContext.Provider>,
    );

    const title = screen.getByRole('textbox', {
      name: 'Enter title of your video here',
    });
    await userEvent.type(title, 'video title');
    const inputVideoFile = screen.getByTestId('input-video-test-id');
    const videoFile = new File(['(⌐□_□)'], 'video.mp4', { type: 'video/mp4' });

    await userEvent.upload(inputVideoFile, videoFile);

    await waitFor(() =>
      expect(container.getElementsByTagName('video')[0]).toHaveAttribute(
        'controls',
      ),
    );
    expect(container.getElementsByTagName('video')[0]).toHaveAttribute(
      'src',
      '/blob/path/to/video',
    );
    screen.getByRole('button', {
      name: 'Click on this button to remove the selected video.',
    });
    const createVideoButton = screen.getByRole('button', {
      name: 'Create a video',
    });

    await userEvent.click(createVideoButton);

    const rerenderedTitle = screen.getByRole('textbox', {
      name: 'Enter title of your video here',
    });
    const rerenderedLicense = await screen.findByRole('combobox', {
      name: 'Select the license',
    });
    expect(
      await within(rerenderedLicense).findByText(
        'Creative Common By Attribution',
      ),
    ).toBeInTheDocument();
    const rerenderedCreateVideoButton = screen.getByRole('button', {
      name: 'Create a video',
    });
    const rerenderedGoBackButton = screen.getByRole('button', {
      name: 'Go back',
    });
    expect(rerenderedTitle).toBeDisabled();
    expect(rerenderedLicense.hasAttribute('disabled')).toBeTruthy();
    expect(rerenderedGoBackButton).toBeDisabled();
    expect(rerenderedCreateVideoButton).toBeDisabled();

    deferred.resolve(mockedVideo);

    await waitFor(() =>
      expect(mockAddUpload).toHaveBeenNthCalledWith(
        1,
        modelName.VIDEOS,
        mockedVideo.id,
        videoFile,
        undefined,
        expect.any(Function),
      ),
    );

    mockUseUploadManager.mockReturnValue({
      addUpload: mockAddUpload,
      resetUpload: jest.fn(),
      uploadManagerState: {
        [mockedVideo.id]: {
          file: videoFile,
          objectId: mockedVideo.id,
          objectType: modelName.VIDEOS,
          progress: 50,
          status: UploadManagerStatus.UPLOADING,
        },
      },
    });

    expect(onUploadSuccess).not.toHaveBeenCalled();
    expect(onPreviousButtonClick).not.toHaveBeenCalled();

    // It simulates upload of a video
    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {},
        }}
      >
        <CreateVOD
          video={mockedVideo}
          onUploadSuccess={onUploadSuccess}
          onPreviousButtonClick={onPreviousButtonClick}
        />
      </UploadManagerContext.Provider>,
    );

    screen.getByText('50 %');

    mockedUseVideo.mockReturnValue({
      ...mockedVideo,
      upload_state: uploadState.PROCESSING,
    });

    mockUseUploadManager.mockReturnValue({
      addUpload: mockAddUpload,
      resetUpload: jest.fn(),
      uploadManagerState: {
        [mockedVideo.id]: {
          file: videoFile,
          objectId: mockedVideo.id,
          objectType: modelName.VIDEOS,
          progress: 100,
          status: UploadManagerStatus.SUCCESS,
        },
      },
    });

    expect(onUploadSuccess).not.toHaveBeenCalled();
    expect(onPreviousButtonClick).not.toHaveBeenCalled();

    // It simulates upload end of a video
    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {},
        }}
      >
        <CreateVOD
          video={mockedVideo}
          onUploadSuccess={onUploadSuccess}
          onPreviousButtonClick={onPreviousButtonClick}
        />
      </UploadManagerContext.Provider>,
    );

    await waitFor(() => expect(onUploadSuccess).toHaveBeenCalled());
    expect(onPreviousButtonClick).not.toHaveBeenCalled();

    expect(fetchMock.calls()[1][0]).toEqual('/api/videos/videoId/');
    expect(fetchMock.calls()[1][1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer json web token',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: '{"title":"video title","license":"CC_BY"}',
    });
  });

  it('renders CreateVOD and tries to create video with completed fields, but it fails', async () => {
    const mockedVideo = videoMockFactory({
      id: 'videoId',
      title: null,
      description: null,
      upload_state: uploadState.PENDING,
      is_ready_to_show: false,
    });

    mockedUseVideo.mockReturnValue(mockedVideo);

    mockedUseAppConfig.mockReturnValue({
      static: {
        img: {
          videoWizardBackground: 'img/path/videoWizardBackground',
        },
      },
    } as any);

    fetchMock.mock(
      `/api/videos/`,
      {
        actions: { POST: { license: { choices: licenseChoices } } },
      },
      { method: 'OPTIONS' },
    );

    const mockAddUpload = jest.fn();
    mockUseUploadManager.mockReturnValue({
      addUpload: mockAddUpload,
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    let deferred = new Deferred();
    fetchMock.mock(`/api/videos/${mockedVideo.id}/`, deferred.promise);

    const onUploadSuccess = jest.fn();
    const onPreviousButtonClick = jest.fn();

    const { container, rerender } = render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {},
        }}
      >
        <CreateVOD
          video={mockedVideo}
          onUploadSuccess={onUploadSuccess}
          onPreviousButtonClick={onPreviousButtonClick}
        />
      </UploadManagerContext.Provider>,
    );

    const title = screen.getByRole('textbox', {
      name: 'Enter title of your video here',
    });
    await userEvent.type(title, 'video title');
    const inputVideoFile = screen.getByTestId('input-video-test-id');
    const videoFile = new File(['(⌐□_□)'], 'video.mp4', { type: 'video/mp4' });

    await userEvent.upload(inputVideoFile, videoFile);

    await waitFor(() =>
      expect(container.getElementsByTagName('video')[0]).toHaveAttribute(
        'controls',
      ),
    );
    expect(container.getElementsByTagName('video')[0]).toHaveAttribute(
      'src',
      '/blob/path/to/video',
    );
    screen.getByRole('button', {
      name: 'Click on this button to remove the selected video.',
    });
    const createVideoButton = screen.getByRole('button', {
      name: 'Create a video',
    });

    await userEvent.click(createVideoButton);

    deferred.reject();

    await screen.findByText('Video infos update has failed !');

    deferred = new Deferred();
    fetchMock.mock(`/api/videos/${mockedVideo.id}/`, deferred.promise, {
      overwriteRoutes: true,
    });

    await userEvent.click(createVideoButton);

    deferred.resolve(mockedVideo);

    await waitFor(() =>
      expect(mockAddUpload).toHaveBeenNthCalledWith(
        1,
        modelName.VIDEOS,
        mockedVideo.id,
        videoFile,
        undefined,
        expect.any(Function),
      ),
    );

    mockUseUploadManager.mockReturnValue({
      addUpload: mockAddUpload,
      resetUpload: jest.fn(),
      uploadManagerState: {
        [mockedVideo.id]: {
          file: videoFile,
          objectId: mockedVideo.id,
          objectType: modelName.VIDEOS,
          progress: 50,
          status: UploadManagerStatus.UPLOADING,
        },
      },
    });

    expect(onUploadSuccess).not.toHaveBeenCalled();
    expect(onPreviousButtonClick).not.toHaveBeenCalled();

    // It simulates upload of a video
    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {},
        }}
      >
        <CreateVOD
          video={mockedVideo}
          onUploadSuccess={onUploadSuccess}
          onPreviousButtonClick={onPreviousButtonClick}
        />
      </UploadManagerContext.Provider>,
    );

    const rerenderedTitle = screen.getByRole('textbox', {
      name: 'Enter title of your video here',
    });
    const rerenderedLicense = await screen.findByRole('combobox', {
      name: 'Select the license',
    });
    expect(
      await within(rerenderedLicense).findByText(
        'Creative Common By Attribution',
      ),
    ).toBeInTheDocument();
    const rerenderedCreateVideoButton = screen.getByRole('button', {
      name: 'Create a video',
    });
    const rerenderedGoBackButton = screen.getByRole('button', {
      name: 'Go back',
    });
    screen.getByText('50 %');
    expect(rerenderedTitle).toBeDisabled();
    expect(rerenderedLicense.hasAttribute('disabled')).toBeTruthy();
    expect(rerenderedGoBackButton).toBeDisabled();
    expect(rerenderedCreateVideoButton).toBeDisabled();

    mockedUseVideo.mockReturnValue({
      ...mockedVideo,
      upload_state: uploadState.PROCESSING,
    });

    mockUseUploadManager.mockReturnValue({
      addUpload: mockAddUpload,
      resetUpload: jest.fn(),
      uploadManagerState: {
        [mockedVideo.id]: {
          file: videoFile,
          objectId: mockedVideo.id,
          objectType: modelName.VIDEOS,
          progress: 100,
          status: UploadManagerStatus.SUCCESS,
        },
      },
    });

    expect(onUploadSuccess).not.toHaveBeenCalled();
    expect(onPreviousButtonClick).not.toHaveBeenCalled();

    // It simulates upload end of a video
    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {},
        }}
      >
        <CreateVOD
          video={mockedVideo}
          onUploadSuccess={onUploadSuccess}
          onPreviousButtonClick={onPreviousButtonClick}
        />
      </UploadManagerContext.Provider>,
    );

    await waitFor(() => expect(onUploadSuccess).toHaveBeenCalled());
    expect(onPreviousButtonClick).not.toHaveBeenCalled();
  });
});

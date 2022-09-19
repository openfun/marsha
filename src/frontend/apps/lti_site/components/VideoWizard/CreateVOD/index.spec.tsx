import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React, { PropsWithChildren } from 'react';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { VIDEO_WIZARD_ROUTE } from 'components/routes';
import {
  UploadManagerContext,
  UploadManagerStatus,
  useUploadManager,
} from 'components/UploadManager';
import { useAppConfig } from 'data/stores/useAppConfig';
import { useJwt } from 'data/stores/useJwt';
import { useVideo } from 'data/stores/useVideo';
import { modelName } from 'types/models';
import { uploadState } from 'types/tracks';
import { Deferred } from 'utils/tests/Deferred';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import CreateVOD from '.';
import { AppConfig } from 'types/AppData';

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: jest.fn(),
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

jest.mock('components/UploadManager', () => ({
  useUploadManager: jest.fn(),
  UploadManagerContext: {
    Provider: ({ children }: PropsWithChildren<{}>) => children,
  },
  UploadManagerStatus: jest.requireActual('components/UploadManager')
    .UploadManagerStatus,
}));
const mockUseUploadManager = useUploadManager as jest.MockedFunction<
  typeof useUploadManager
>;

jest.mock('data/stores/useVideo', () => ({
  useVideo: jest.fn(),
}));
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

    render(<CreateVOD video={mockedVideo} />);

    screen.getByText('Video creation');
    screen.getByText(
      'Use this wizard to create a new video, that you will be able to share with your students.',
    );

    screen.getByRole('textbox', { name: 'Enter title of your video here' });
    screen.getByText('Add a video or drag & drop it');
    screen.getByTestId('input-video-test-id');
    await waitFor(() =>
      expect(
        screen.getByRole('textbox', {
          name: 'Select the license under which you want to publish your video, CC_BY',
        }),
      ).toHaveValue('Creative Common By Attribution'),
    );

    const goBackButton = screen.getByRole('button', { name: 'Go back' });
    const createVideoButton = screen.getByRole('button', {
      name: 'Create a video',
    });
    expect(goBackButton).not.toBeDisabled();
    expect(createVideoButton).toBeDisabled();
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

    render(<CreateVOD video={mockedVideo} />);

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
    await waitFor(() =>
      expect(
        screen.getByRole('textbox', {
          name: 'Select the license under which you want to publish your video, CC_BY',
        }),
      ).toHaveValue('Creative Common By Attribution'),
    );

    const goBackButton = screen.getByRole('button', { name: 'Go back' });
    const createVideoButton = screen.getByRole('button', {
      name: 'Create a video',
    });
    expect(goBackButton).not.toBeDisabled();
    expect(createVideoButton).toBeDisabled();
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

    render(<CreateVOD video={mockedVideo} />, {
      routerOptions: {
        routes: [
          {
            path: VIDEO_WIZARD_ROUTE(),
            render: () => <p>root wizard</p>,
          },
        ],
      },
    });

    const goBackButton = screen.getByRole('button', { name: 'Go back' });
    userEvent.click(goBackButton);

    await screen.findByText('root wizard');
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

    const { container, rerender } = render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {},
        }}
      >
        <CreateVOD video={mockedVideo} />
      </UploadManagerContext.Provider>,
      {
        routerOptions: {
          routes: [{ path: '/dashboard', render: () => <p>dashboard</p> }],
        },
      },
    );

    const title = screen.getByRole('textbox', {
      name: 'Enter title of your video here',
    });
    userEvent.type(title, 'video title');
    const inputVideoFile = screen.getByTestId('input-video-test-id');
    const videoFile = new File(['(⌐□_□)'], 'video.mp4', { type: 'video/mp4' });
    await act(async () => userEvent.upload(inputVideoFile, videoFile));
    const video = container.getElementsByTagName('video')[0];
    await waitFor(() => expect(video).toHaveAttribute('controls'));
    expect(video).toHaveAttribute('src', '/blob/path/to/video');
    screen.getByRole('button', {
      name: 'Click on this button to remove the selected video.',
    });
    const createVideoButton = screen.getByRole('button', {
      name: 'Create a video',
    });

    userEvent.click(createVideoButton);

    const rerenderedTitle = screen.getByRole('textbox', {
      name: 'Enter title of your video here',
    });
    const rerenderedLicense = screen.getByRole('textbox', {
      name: 'Select the license under which you want to publish your video, CC_BY',
    });
    const rerenderedCreateVideoButton = screen.getByRole('button', {
      name: 'Create a video',
    });
    const rerenderedGoBackButton = screen.getByRole('button', {
      name: 'Go back',
    });
    expect(rerenderedTitle).toBeDisabled();
    expect(rerenderedLicense).toBeDisabled();
    expect(rerenderedGoBackButton).toBeDisabled();
    expect(rerenderedCreateVideoButton).toBeDisabled();

    deferred.resolve(mockedVideo);

    await waitFor(() =>
      expect(mockAddUpload).toHaveBeenNthCalledWith(
        1,
        modelName.VIDEOS,
        mockedVideo.id,
        videoFile,
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
    // It simulates upload of a video
    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {},
        }}
      >
        <CreateVOD video={mockedVideo} />
      </UploadManagerContext.Provider>,
      {
        routerOptions: {
          routes: [{ path: '/dashboard', render: () => <p>dashboard</p> }],
        },
      },
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

    // It simulates upload end of a video
    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {},
        }}
      >
        <CreateVOD video={mockedVideo} />
      </UploadManagerContext.Provider>,
      {
        routerOptions: {
          routes: [
            {
              path: DASHBOARD_ROUTE(modelName.VIDEOS),
              render: () => <p>dashboard</p>,
            },
          ],
        },
      },
    );

    await screen.findByText('dashboard');

    expect(fetchMock.calls()[1][0]).toEqual('/api/videos/videoId/');
    expect(fetchMock.calls()[1][1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer json web token',
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

    const { container, rerender } = render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {},
        }}
      >
        <CreateVOD video={mockedVideo} />
      </UploadManagerContext.Provider>,
      {
        routerOptions: {
          routes: [{ path: '/dashboard', render: () => <p>dashboard</p> }],
        },
      },
    );

    const title = screen.getByRole('textbox', {
      name: 'Enter title of your video here',
    });
    userEvent.type(title, 'video title');
    const inputVideoFile = screen.getByTestId('input-video-test-id');
    const videoFile = new File(['(⌐□_□)'], 'video.mp4', { type: 'video/mp4' });
    await act(async () => userEvent.upload(inputVideoFile, videoFile));
    const video = container.getElementsByTagName('video')[0];
    await waitFor(() => expect(video).toHaveAttribute('controls'));
    expect(video).toHaveAttribute('src', '/blob/path/to/video');
    screen.getByRole('button', {
      name: 'Click on this button to remove the selected video.',
    });
    const createVideoButton = screen.getByRole('button', {
      name: 'Create a video',
    });

    userEvent.click(createVideoButton);

    deferred.reject();

    await screen.findByText('Video infos update has failed !');

    deferred = new Deferred();
    fetchMock.mock(`/api/videos/${mockedVideo.id}/`, deferred.promise, {
      overwriteRoutes: true,
    });

    userEvent.click(createVideoButton);

    deferred.resolve(mockedVideo);

    await waitFor(() =>
      expect(mockAddUpload).toHaveBeenNthCalledWith(
        1,
        modelName.VIDEOS,
        mockedVideo.id,
        videoFile,
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
    // It simulates upload of a video
    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {},
        }}
      >
        <CreateVOD video={mockedVideo} />
      </UploadManagerContext.Provider>,
      {
        routerOptions: {
          routes: [{ path: '/dashboard', render: () => <p>dashboard</p> }],
        },
      },
    );

    const rerenderedTitle = screen.getByRole('textbox', {
      name: 'Enter title of your video here',
    });
    const rerenderedLicense = screen.getByRole('textbox', {
      name: 'Select the license under which you want to publish your video, CC_BY',
    });
    const rerenderedCreateVideoButton = screen.getByRole('button', {
      name: 'Create a video',
    });
    const rerenderedGoBackButton = screen.getByRole('button', {
      name: 'Go back',
    });
    screen.getByText('50 %');
    expect(rerenderedTitle).toBeDisabled();
    expect(rerenderedLicense).toBeDisabled();
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
    // It simulates upload end of a video
    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {},
        }}
      >
        <CreateVOD video={mockedVideo} />
      </UploadManagerContext.Provider>,
      {
        routerOptions: {
          routes: [
            {
              path: DASHBOARD_ROUTE(modelName.VIDEOS),
              render: () => <p>dashboard</p>,
            },
          ],
        },
      },
    );

    await screen.findByText('dashboard');
  });
});

import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { createMemoryHistory } from 'history';
import {
  modelName,
  UploadManagerStatus,
  useUploadManager,
} from 'lib-components';
import { render, Deferred } from 'lib-tests';
import { Router } from 'react-router-dom';

import VideoCreateForm from './VideoCreateForm';

const playlistsResponse = {
  count: 1,
  next: null,
  previous: null,
  results: [
    { id: 'some-playlist-id', title: 'some playlist title' },
    { id: 'an-other-playlist', title: 'an other title' },
  ],
};

const videosResponse = {
  actions: {
    POST: {
      license: {
        choices: [
          {
            display_name: 'Creative Common By Attribution',
            value: 'CC_BY',
          },
          {
            display_name: 'Creative Common By Attribution Share Alike',
            value: 'CC_BY-SA',
          },
          {
            display_name:
              'Creative Common By Attribution Non Commercial No Derivates',
            value: 'CC_BY-NC-ND',
          },
          { display_name: 'Public Domain Dedication ', value: 'CC0' },
          { display_name: 'All rights reserved', value: 'NO_CC' },
        ],
      },
    },
  },
};

URL.createObjectURL = () => '/blob/path/to/video';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useUploadManager: jest.fn(),
}));
const mockUseUploadManager = useUploadManager as jest.MockedFunction<
  typeof useUploadManager
>;

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

let deferredPlaylists: Deferred<unknown>;
let deferredVideos: Deferred<unknown>;
describe('<VideoCreateForm />', () => {
  beforeEach(() => {
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    deferredPlaylists = new Deferred();
    fetchMock.get(
      '/api/playlists/?limit=20&offset=0&ordering=-created_on&can_edit=true',
      deferredPlaylists.promise,
    );

    deferredVideos = new Deferred();
    fetchMock.mock('/api/videos/', deferredVideos.promise, {
      method: 'OPTIONS',
    });
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
    consoleError.mockClear();
  });

  test('renders VideoCreateForm', async () => {
    render(<VideoCreateForm />);

    deferredPlaylists.resolve(playlistsResponse);
    deferredVideos.resolve(videosResponse);

    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    expect(
      await screen.findByRole('button', {
        name: 'Choose the playlist.; Selected: some-playlist-id',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /description/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Add a video or drag & drop it'),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', {
        name: 'Select the license under which you want to publish your video; Selected: CC_BY',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Add Video/i }),
    ).toBeInTheDocument();
  });

  test('fields mandatory', async () => {
    render(<VideoCreateForm />);

    deferredPlaylists.resolve(playlistsResponse);
    deferredVideos.resolve(videosResponse);

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'my title' },
    });

    userEvent.click(
      await screen.findByRole('button', {
        name: 'Choose the playlist.; Selected: some-playlist-id',
      }),
    );

    userEvent.click(
      await screen.findByRole('option', { name: 'an other title' }),
    );

    expect(
      await screen.findByRole('button', {
        name: 'Choose the playlist.; Selected: an-other-playlist',
      }),
    ).toBeInTheDocument();

    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    const hiddenInput = screen.getByTestId('input-video-test-id');

    userEvent.upload(hiddenInput, file);

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Add Video/i }),
      ).not.toBeDisabled(),
    );
  });

  test('fields are posted correctly', async () => {
    const history = createMemoryHistory();
    fetchMock.post('/api/videos/', {
      ok: true,
      id: '1234',
    });

    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      uploadManagerState: {
        '1234': {
          file: file,
          objectId: '1234',
          objectType: modelName.VIDEOS,
          progress: 100,
          status: UploadManagerStatus.SUCCESS,
        },
      },
      resetUpload: jest.fn(),
    });

    render(
      <Router history={history}>
        <VideoCreateForm />
      </Router>,
    );

    deferredPlaylists.resolve(playlistsResponse);
    deferredVideos.resolve(videosResponse);

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'my title' },
    });

    fireEvent.change(screen.getByRole('textbox', { name: /description/i }), {
      target: { value: 'my description' },
    });

    userEvent.click(
      await screen.findByRole('button', {
        name: 'Choose the playlist.; Selected: some-playlist-id',
      }),
    );

    userEvent.click(
      await screen.findByRole('option', { name: 'an other title' }),
    );

    expect(
      await screen.findByRole('button', {
        name: 'Choose the playlist.; Selected: an-other-playlist',
      }),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole('button', {
        name: 'Select the license under which you want to publish your video; Selected: CC_BY',
      }),
    ).toBeInTheDocument();

    const hiddenInput = screen.getByTestId('input-video-test-id');

    userEvent.upload(hiddenInput, file);

    const submit = screen.getByRole('button', { name: /Add Video/i });

    await waitFor(() => expect(submit).not.toBeDisabled());

    userEvent.click(submit);

    await waitFor(() => {
      expect(
        fetchMock.lastCall('/api/videos/', {
          method: 'POST',
        })?.[1],
      ).toEqual({
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({
          playlist: 'an-other-playlist',
          title: 'my title',
          license: 'CC_BY',
          description: 'my description',
          videoFile: {
            path: 'course.mp4',
          },
        }),
      });
    });

    await waitFor(() => {
      expect(history.location.pathname).toBe('/my-contents/videos/1234');
    });
  });

  test('post failed', async () => {
    fetchMock.post('/api/videos/', 500);

    render(<VideoCreateForm />);

    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });

    deferredPlaylists.resolve(playlistsResponse);
    deferredVideos.resolve(videosResponse);

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'my title' },
    });

    fireEvent.change(screen.getByRole('textbox', { name: /description/i }), {
      target: { value: 'my description' },
    });

    userEvent.click(
      await screen.findByRole('button', {
        name: 'Choose the playlist.; Selected: some-playlist-id',
      }),
    );

    userEvent.click(
      await screen.findByRole('option', { name: 'an other title' }),
    );

    expect(
      await screen.findByRole('button', {
        name: 'Choose the playlist.; Selected: an-other-playlist',
      }),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole('button', {
        name: 'Select the license under which you want to publish your video; Selected: CC_BY',
      }),
    ).toBeInTheDocument();

    const hiddenInput = screen.getByTestId('input-video-test-id');

    userEvent.upload(hiddenInput, file);

    const submit = screen.getByRole('button', { name: /Add Video/i });

    await waitFor(() => expect(submit).not.toBeDisabled());

    userEvent.click(submit);

    expect(
      await screen.findByText(
        /Sorry, an error has occurred. Please try again./i,
      ),
    ).toBeInTheDocument();

    expect(consoleError).toHaveBeenCalled();
  });

  test('error playlist', async () => {
    render(<VideoCreateForm />);

    deferredPlaylists.resolve(500);
    deferredVideos.resolve(videosResponse);

    expect(
      await screen.findByText(
        /Sorry, an error has occurred. Please try again./i,
      ),
    ).toBeInTheDocument();

    expect(consoleError).toHaveBeenCalled();
  });
});

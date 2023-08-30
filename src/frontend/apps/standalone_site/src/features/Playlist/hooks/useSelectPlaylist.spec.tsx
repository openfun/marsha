import { renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { Form } from 'lib-components';
import { Deferred, render, wrapperUtils } from 'lib-tests';

import { routes } from 'routes';

import useSelectPlaylist from './useSelectPlaylist';

const playlistsResponse = {
  count: 1,
  next: null,
  previous: null,
  results: [
    { id: 'some-playlist-id', title: 'some playlist title' },
    { id: 'an-other-playlist', title: 'an other title' },
  ],
};

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<useSelectPlaylist />', () => {
  afterEach(() => {
    fetchMock.restore();
    consoleError.mockClear();
  });

  test('renders useSelectPlaylist success', async () => {
    fetchMock.get(
      '/api/playlists/?limit=20&offset=0&ordering=-created_on&can_edit=true',
      playlistsResponse,
    );

    const useSelectPlaylistSuccess = new Deferred();
    const { result, unmount } = renderHook(() => useSelectPlaylist(), {
      wrapper: wrapperUtils(),
    });

    await waitFor(() => {
      expect(result.current.playlistResponse).toBeDefined();
    });

    useSelectPlaylistSuccess.resolve(result.current.playlistResponse);

    expect(await useSelectPlaylistSuccess.promise).toEqual({
      count: 1,
      next: null,
      previous: null,
      results: [
        { id: 'some-playlist-id', title: 'some playlist title' },
        { id: 'an-other-playlist', title: 'an other title' },
      ],
    });

    expect(result.current.errorPlaylist).toBeNull();

    unmount();

    render(
      <Form onSubmitError={() => ({})} onSubmit={() => {}}>
        {result.current.selectPlaylist}
      </Form>,
    );

    expect(
      screen.queryByRole('button', { name: 'Create a new playlist' }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Choose the playlist.',
      }),
    );

    await userEvent.click(
      await screen.findByRole('option', { name: 'an other title' }),
    );

    expect(
      await screen.findByRole('button', {
        name: 'Choose the playlist.; Selected: an-other-playlist',
      }),
    ).toBeInTheDocument();
  });

  test('renders useSelectPlaylist success with new playlist creation button', async () => {
    fetchMock.get(
      '/api/playlists/?limit=20&offset=0&ordering=-created_on&can_edit=true',
      playlistsResponse,
    );

    const useSelectPlaylistSuccess = new Deferred();
    const { result, unmount } = renderHook(
      () =>
        useSelectPlaylist({
          withPlaylistCreation: true,
        }),
      {
        wrapper: wrapperUtils(),
      },
    );

    await waitFor(() => {
      expect(result.current.playlistResponse).toBeDefined();
    });

    useSelectPlaylistSuccess.resolve(result.current.playlistResponse);

    expect(await useSelectPlaylistSuccess.promise).toEqual({
      count: 1,
      next: null,
      previous: null,
      results: [
        { id: 'some-playlist-id', title: 'some playlist title' },
        { id: 'an-other-playlist', title: 'an other title' },
      ],
    });

    expect(result.current.errorPlaylist).toBeNull();

    unmount();

    render(
      <Form onSubmitError={() => ({})} onSubmit={() => {}}>
        {result.current.selectPlaylist}
      </Form>,
    );

    expect(
      screen.getByRole('button', { name: 'Create a new playlist' }),
    ).toBeInTheDocument();

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Choose the playlist.',
      }),
    );

    await userEvent.click(
      await screen.findByRole('option', { name: 'an other title' }),
    );

    expect(
      await screen.findByRole('button', {
        name: 'Choose the playlist.; Selected: an-other-playlist',
      }),
    ).toBeInTheDocument();
  });

  test('renders useSelectPlaylist and clicks on the create playlist button', async () => {
    fetchMock.get(
      '/api/playlists/?limit=20&offset=0&ordering=-created_on&can_edit=true',
      playlistsResponse,
    );

    const useSelectPlaylistSuccess = new Deferred();
    const { result, unmount } = renderHook(
      () =>
        useSelectPlaylist({
          withPlaylistCreation: true,
        }),
      {
        wrapper: wrapperUtils(),
      },
    );

    await waitFor(() => {
      expect(result.current.playlistResponse).toBeDefined();
    });

    useSelectPlaylistSuccess.resolve(result.current.playlistResponse);

    expect(await useSelectPlaylistSuccess.promise).toEqual({
      count: 1,
      next: null,
      previous: null,
      results: [
        { id: 'some-playlist-id', title: 'some playlist title' },
        { id: 'an-other-playlist', title: 'an other title' },
      ],
    });

    expect(result.current.errorPlaylist).toBeNull();

    unmount();

    render(
      <Form onSubmitError={() => ({})} onSubmit={() => {}}>
        {result.current.selectPlaylist}
      </Form>,
      {
        routerOptions: {
          routes: [
            {
              path: routes.PLAYLIST.subRoutes.CREATE.path,
              element: <div>create playlist page</div>,
            },
          ],
        },
      },
    );

    const createPlaylistButton = screen.getByRole('button', {
      name: 'Create a new playlist',
    });
    expect(createPlaylistButton).toBeInTheDocument();

    await userEvent.click(createPlaylistButton);

    expect(await screen.findByText('create playlist page')).toBeInTheDocument();
  });

  test('renders useSelectPlaylist error', async () => {
    fetchMock.get(
      '/api/playlists/?limit=20&offset=0&ordering=-created_on&can_edit=true',
      {
        body: { detail: 'Sorry...' },
        headers: { 'content-type': 'application/json' },
        status: 401,
      },
    );

    const useSelectPlaylistSuccess = new Deferred();
    const { result } = renderHook(() => useSelectPlaylist(), {
      wrapper: wrapperUtils(),
    });

    useSelectPlaylistSuccess.resolve(result.current.playlistResponse);

    await waitFor(() => {
      expect(result.current.errorPlaylist?.error).toEqual({
        code: 'exception',
        message: 'Failed to get list of playlists.',
        detail: 'Sorry...',
        status: 401,
        response: expect.objectContaining({
          status: 401,
        }),
        body: expect.objectContaining({
          detail: 'Sorry...',
        }),
      });
    });
  });
});

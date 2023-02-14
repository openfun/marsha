import { screen } from '@testing-library/react';
import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { Form } from 'lib-components';
import { render, Deferred, appendUtilsElement } from 'lib-tests';
import { Fragment } from 'react';

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

const Wrapper: WrapperComponent<Element> = ({ children }: Element) => {
  return appendUtilsElement(<Fragment>{children}</Fragment>);
};

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
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useSelectPlaylist((results) => {
          useSelectPlaylistSuccess.resolve(results);
        }),
      {
        wrapper: Wrapper,
      },
    );

    await waitForNextUpdate();

    expect(result.current.errorPlaylist).toBeNull();
    expect(await useSelectPlaylistSuccess.promise).toEqual([
      { id: 'some-playlist-id', title: 'some playlist title' },
      { id: 'an-other-playlist', title: 'an other title' },
    ]);

    render(
      <Form onSubmitError={() => ({})} onSubmit={() => {}}>
        {result.current.selectPlaylist}
      </Form>,
    );

    userEvent.click(
      await screen.findByRole('button', {
        name: 'Choose the playlist.',
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
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useSelectPlaylist((results) => {
          useSelectPlaylistSuccess.resolve(results);
        }),
      {
        wrapper: Wrapper,
      },
    );

    await waitForNextUpdate();

    expect(result.current.errorPlaylist?.error).toEqual({
      code: 'exception',
      message: 'Failed to get list of playlists.',
      detail: 'Sorry...',
      status: 401,
      response: expect.objectContaining({
        status: 401,
      }),
    });
  });
});

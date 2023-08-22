import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { Deferred, render } from 'lib-tests';

import LiveCreateForm from './LiveCreateForm';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const playlistsResponse = {
  count: 2,
  next: null,
  previous: null,
  results: [
    { id: 'some-playlist-id', title: 'some playlist title' },
    { id: 'an-other-playlist', title: 'an other title' },
  ],
};

let deferredPlaylists: Deferred<unknown>;
describe('<LiveCreateForm />', () => {
  beforeEach(() => {
    deferredPlaylists = new Deferred();
    fetchMock.get(
      '/api/playlists/?limit=20&offset=0&ordering=-created_on&can_edit=true',
      deferredPlaylists.promise,
    );
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  test('renders LiveCreateForm', async () => {
    render(<LiveCreateForm />);

    deferredPlaylists.resolve(playlistsResponse);

    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    expect(
      await screen.findByRole('button', {
        name: 'Choose the playlist.; Selected: some-playlist-id',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create a new playlist' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /description/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Add Webinar/i }),
    ).toBeInTheDocument();
  });

  test('renders LiveCreateForm with no existing playlist', async () => {
    render(<LiveCreateForm />);

    deferredPlaylists.resolve({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    expect(
      await screen.findByRole('button', {
        name: 'Choose the playlist.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create a new playlist' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /description/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Add Webinar/i }),
    ).toBeInTheDocument();
  });

  test('fields mandatory', async () => {
    render(<LiveCreateForm />);

    deferredPlaylists.resolve(playlistsResponse);

    expect(
      screen.getByRole('button', { name: 'Create a new playlist' }),
    ).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /Add Webinar/i });

    expect(button).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'my title' },
    });

    expect(button).toBeDisabled();

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Choose the playlist.; Selected: some-playlist-id',
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

    expect(button).not.toBeDisabled();
  });

  test('fields are posted correctly', async () => {
    fetchMock.post('/api/videos/', {
      ok: true,
      id: '1234',
    });

    fetchMock.mock(
      '/api/videos/1234/initiate-live/',
      {
        ok: true,
        id: '1234',
        is_live: true,
      },
      {
        method: 'POST',
      },
    );

    render(<LiveCreateForm />);

    deferredPlaylists.resolve(playlistsResponse);

    expect(
      screen.getByRole('button', { name: 'Create a new playlist' }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'my title' },
    });

    fireEvent.change(screen.getByRole('textbox', { name: /description/i }), {
      target: { value: 'my description' },
    });

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Choose the playlist.; Selected: some-playlist-id',
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

    const submit = screen.getByRole('button', { name: /Add Webinar/i });

    await waitFor(() => expect(submit).not.toBeDisabled());

    await userEvent.click(submit);

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
          live_type: 'jitsi',
          description: 'my description',
        }),
      });
    });

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('../1234'));
  });

  test('post failed', async () => {
    fetchMock.post('/api/videos/', 500);

    render(<LiveCreateForm />);

    deferredPlaylists.resolve(playlistsResponse);

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'my title' },
    });

    fireEvent.change(screen.getByRole('textbox', { name: /description/i }), {
      target: { value: 'my description' },
    });

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Choose the playlist.; Selected: some-playlist-id',
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

    const submit = screen.getByRole('button', { name: /Add Webinar/i });

    await waitFor(() => expect(submit).not.toBeDisabled());

    await userEvent.click(submit);

    expect(
      await screen.findByText(
        /Sorry, an error has occurred. Please try again./i,
      ),
    ).toBeInTheDocument();
  });

  test('error playlist', async () => {
    render(<LiveCreateForm />);

    deferredPlaylists.resolve(500);

    expect(
      await screen.findByText(
        /Sorry, an error has occurred. Please try again./i,
      ),
    ).toBeInTheDocument();
  });
});

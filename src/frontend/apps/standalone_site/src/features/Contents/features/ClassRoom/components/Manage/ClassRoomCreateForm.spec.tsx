import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { Deferred, render } from 'lib-tests';

import ClassRoomCreateForm from './ClassRoomCreateForm';

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

describe('<ClassRoomCreateForm />', () => {
  const deferred = new Deferred();

  beforeEach(() => {
    fetchMock.get(
      '/api/playlists/?limit=20&offset=0&ordering=-created_on&can_edit=true',
      deferred.promise,
    );
  });

  afterEach(() => {
    fetchMock.restore();
  });

  test('renders ClassRoomCreateForm', () => {
    render(<ClassRoomCreateForm />);

    deferred.resolve(playlistsResponse);

    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /playlist/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Create a new playlist' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /description/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Add classroom/i }),
    ).toBeInTheDocument();
  });

  test('fields mandatory', async () => {
    render(<ClassRoomCreateForm />);

    deferred.resolve(playlistsResponse);

    expect(
      screen.getByRole('link', { name: 'Create a new playlist' }),
    ).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /Add Classroom/i });

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
    fetchMock.post('/api/classrooms/', {
      ok: true,
      id: 1243,
    });

    render(<ClassRoomCreateForm />);

    deferred.resolve(playlistsResponse);

    expect(
      screen.getByRole('link', { name: 'Create a new playlist' }),
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

    await userEvent.click(
      screen.getByRole('button', { name: /Add classroom/i }),
    );

    await waitFor(() => {
      expect(fetchMock.lastCall()?.[0]).toEqual(`/api/classrooms/`);
    });

    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: { 'Content-Type': 'application/json', 'Accept-Language': 'en' },
      method: 'POST',
      body: JSON.stringify({
        playlist: 'an-other-playlist',
        title: 'my title',
        description: 'my description',
      }),
    });

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('../1243'));
  });

  test('post failed', async () => {
    fetchMock.post('/api/classrooms/', 500);

    render(<ClassRoomCreateForm />);

    deferred.resolve(playlistsResponse);

    expect(
      screen.getByRole('link', { name: 'Create a new playlist' }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'my title' },
    });

    await userEvent.click(
      screen.getByLabelText(/Choose the playlist./i, { selector: 'button' }),
    );

    // Wait for the mocked playlist to be fetched
    expect(
      await screen.findByRole('option', { selected: false }),
    ).toBeInTheDocument();

    // Select the mocked playlist
    await userEvent.click(screen.getByRole('option', { selected: false }));

    expect(
      screen.queryByText(/Sorry, an error has occurred. Please try again./i),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /Add classroom/i }),
    );

    expect(
      await screen.findByText(
        /Sorry, an error has occurred. Please try again./i,
      ),
    ).toBeInTheDocument();
  });

  test('error permission', async () => {
    fetchMock.post('/api/classrooms/', {
      status: 403,
      body: {
        detail: "Vous n'avez pas la permission d'effectuer cette action.",
      },
    });

    render(<ClassRoomCreateForm />);

    deferred.resolve(playlistsResponse);

    expect(
      screen.getByRole('link', { name: 'Create a new playlist' }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'my title' },
    });

    await userEvent.click(
      screen.getByLabelText(/Choose the playlist./i, { selector: 'button' }),
    );

    // Wait for the mocked playlist to be fetched
    expect(
      await screen.findByRole('option', { selected: false }),
    ).toBeInTheDocument();

    // Select the mocked playlist
    await userEvent.click(screen.getByRole('option', { selected: false }));

    expect(
      screen.queryByText(
        /Sorry, you don't have the permission to create a classroom./i,
      ),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /Add classroom/i }),
    );

    expect(
      await screen.findByText(
        /Sorry, you don't have the permission to create a classroom./i,
      ),
    ).toBeInTheDocument();
  });

  it('renders correctly the form when there is no existing plyalist', () => {
    render(<ClassRoomCreateForm />);

    deferred.resolve({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /playlist/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Create a new playlist' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /description/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Add classroom/i }),
    ).toBeInTheDocument();
  });
});

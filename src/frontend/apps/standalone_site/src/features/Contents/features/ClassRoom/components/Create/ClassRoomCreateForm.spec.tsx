import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { createMemoryHistory } from 'history';
import { render, Deferred } from 'lib-tests';
import { Router } from 'react-router-dom';

import ClassRoomCreateForm from './ClassRoomCreateForm';

const playlistsResponse = {
  count: 2,
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
    consoleError.mockClear();
  });

  test('renders ClassRoomCreateForm', () => {
    render(<ClassRoomCreateForm />);

    deferred.resolve(playlistsResponse);

    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /playlist/i }),
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

    const button = screen.getByRole('button', { name: /Add Classroom/i });

    expect(button).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'my title' },
    });

    expect(button).toBeDisabled();

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

    expect(button).not.toBeDisabled();
  });

  test('fields are posted correctly', async () => {
    const history = createMemoryHistory();
    fetchMock.post('/api/classrooms/', {
      ok: true,
      id: 1243,
    });

    render(
      <Router history={history}>
        <ClassRoomCreateForm />
      </Router>,
    );

    deferred.resolve(playlistsResponse);

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

    userEvent.click(screen.getByRole('button', { name: /Add classroom/i }));

    await waitFor(() => {
      expect(fetchMock.lastCall()?.[0]).toEqual(`/api/classrooms/`);
    });

    expect(fetchMock.lastCall()?.[1]).toEqual({
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({
        playlist: 'an-other-playlist',
        title: 'my title',
        description: 'my description',
      }),
    });

    expect(history.location.pathname).toBe('/my-contents/classroom/1243');
  });

  test('post failed', async () => {
    fetchMock.post('/api/classrooms/', 500);

    render(<ClassRoomCreateForm />);

    deferred.resolve(playlistsResponse);

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'my title' },
    });

    userEvent.click(
      screen.getByLabelText(/Choose the playlist./i, { selector: 'button' }),
    );

    // Wait for the mocked playlist to be fetched
    expect(
      await screen.findByRole('option', { selected: false }),
    ).toBeInTheDocument();

    // Select the mocked playlist
    userEvent.click(screen.getByRole('option', { selected: false }));

    expect(
      screen.queryByText(/Sorry, an error has occurred. Please try again./i),
    ).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /Add classroom/i }));

    expect(
      await screen.findByText(
        /Sorry, an error has occurred. Please try again./i,
      ),
    ).toBeInTheDocument();

    expect(consoleError).toHaveBeenCalled();
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

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'my title' },
    });

    userEvent.click(
      screen.getByLabelText(/Choose the playlist./i, { selector: 'button' }),
    );

    // Wait for the mocked playlist to be fetched
    expect(
      await screen.findByRole('option', { selected: false }),
    ).toBeInTheDocument();

    // Select the mocked playlist
    userEvent.click(screen.getByRole('option', { selected: false }));

    expect(
      screen.queryByText(
        /Sorry, you don't have the permission to create a classroom./i,
      ),
    ).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /Add classroom/i }));

    expect(
      await screen.findByText(
        /Sorry, you don't have the permission to create a classroom./i,
      ),
    ).toBeInTheDocument();

    expect(consoleError).toHaveBeenCalled();
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
      screen.getByRole('textbox', { name: /description/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Add classroom/i }),
    ).toBeInTheDocument();
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { render } from 'lib-tests';

import { PlaylistRole } from '../types/playlistAccess';

import { AddUserAccessForm } from './AddUserAccessForm';

describe('AddUserAccessForm', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('json web token');
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('should add a member', async () => {
    fetchMock.get('/api/users/?limit=999&fullname_or_email__icontains=test', {
      count: 3,
      next: null,
      previous: null,
      results: [
        {
          id: '1',
          email: 'user_1@example.com',
          full_name: 'User 1',
        },
        {
          id: '2',
          email: 'user_2@example.com',
          full_name: 'User 2',
        },
        {
          id: '3',
          email: 'user_3@example.com',
          full_name: 'User 3',
        },
      ],
    });
    fetchMock.post('/api/playlist-accesses/', { status: 201, body: {} });
    const mockOnUserAdded = jest.fn();
    render(<AddUserAccessForm playlistId="1" onUserAdded={mockOnUserAdded} />);
    expect(
      screen.getByRole('heading', { name: 'Add member' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Search within user and select the one you want to add to this playlist.',
      ),
    ).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole('textbox', {
        name: 'Search by username or email address...',
      }),
      'test',
    );

    expect(
      await screen.findByRole(
        'button',
        {
          name: 'Add user User 1 in playlist',
        },
        {
          timeout: 3000,
        },
      ),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Add user User 1 in playlist' }),
    );
    await userEvent.click(
      screen.getByRole('combobox', { name: /Select role/i }),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: /Instructor/i }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Add this member' }),
    );

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual('/api/playlist-accesses/'),
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'POST',
      body: JSON.stringify({
        playlist: '1',
        user: '1',
        role: PlaylistRole.INSTRUCTOR,
      }),
    });
    expect(mockOnUserAdded).toHaveBeenCalledTimes(1);
  });

  it('should not add a member if cancelled', async () => {
    fetchMock.get('/api/users/?limit=999&fullname_or_email__icontains=test', {
      count: 3,
      next: null,
      previous: null,
      results: [
        {
          id: '1',
          email: 'user_1@example.com',
          full_name: 'User 1',
        },
        {
          id: '2',
          email: 'user_2@example.com',
          full_name: 'User 2',
        },
        {
          id: '3',
          email: 'user_3@example.com',
          full_name: 'User 3',
        },
      ],
    });
    fetchMock.post('/api/playlist-accesses/', { status: 201, body: {} });
    const mockOnUserAdded = jest.fn();
    render(<AddUserAccessForm playlistId="1" onUserAdded={mockOnUserAdded} />);
    expect(
      screen.getByRole('heading', { name: 'Add member' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Search within user and select the one you want to add to this playlist.',
      ),
    ).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole('textbox', {
        name: 'Search by username or email address...',
      }),
      'test',
    );
    await waitFor(
      async () =>
        expect(
          await screen.findByRole('button', {
            name: 'Add user User 1 in playlist',
          }),
        ).toBeInTheDocument(),
      { timeout: 10000 },
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Add user User 1 in playlist' }),
    );
    await userEvent.click(
      screen.getByRole('combobox', { name: /Select role/i }),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: /Instructor/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/users/?limit=999&fullname_or_email__icontains=test',
      ),
    );
    expect(mockOnUserAdded).toHaveBeenCalledTimes(0);
    expect(
      screen.getByRole('textbox', {
        name: 'Search by username or email address...',
      }),
    ).toBeInTheDocument();
  });
});

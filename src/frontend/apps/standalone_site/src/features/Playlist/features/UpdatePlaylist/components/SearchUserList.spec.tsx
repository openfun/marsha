import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { Deferred, render, wrapInIntlProvider } from 'lib-tests';

import { SearchUserList } from './SearchUserList';

describe('SearchUserList', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
    jest.clearAllMocks();
    fetchMock.restore();
  });
  it('should select a user', async () => {
    fetchMock.get(
      '/api/users/?limit=999&fullname_or_email__icontains=example&id_not_in=1',
      {
        count: 2,
        next: null,
        previous: null,
        results: [
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
      },
    );

    const mockSetSelectedUser = jest.fn();
    render(
      wrapInIntlProvider(
        <SearchUserList
          searchedStr="example"
          setSelectedUser={mockSetSelectedUser}
          excludedUsers={['1']}
        />,
      ),
    );
    await waitFor(async () =>
      expect(
        await screen.findByRole('button', {
          name: 'Add user User 2 in playlist',
        }),
      ).toBeInTheDocument(),
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Add user User 2 in playlist',
      }),
    );
    expect(mockSetSelectedUser).toHaveBeenCalledWith({
      email: 'user_2@example.com',
      full_name: 'User 2',
      id: '2',
    });
  });
  it('should display all users', async () => {
    fetchMock.get(
      '/api/users/?limit=999&fullname_or_email__icontains=example',
      {
        count: 2,
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
      },
    );

    render(
      wrapInIntlProvider(
        <SearchUserList searchedStr="example" setSelectedUser={jest.fn()} />,
      ),
    );
    await waitFor(async () =>
      expect(
        await screen.findByRole('button', {
          name: 'Add user User 1 in playlist',
        }),
      ).toBeInTheDocument(),
    );
  });
  it('should display a message if no users', async () => {
    fetchMock.get(
      '/api/users/?limit=999&fullname_or_email__icontains=example&id_not_in=1',
      {
        count: 0,
        next: null,
        previous: null,
        results: [],
      },
    );

    render(
      wrapInIntlProvider(
        <SearchUserList
          searchedStr="example"
          setSelectedUser={jest.fn()}
          excludedUsers={['1']}
        />,
      ),
    );
    await waitFor(async () =>
      expect(await screen.findByText('No results found.')).toBeInTheDocument(),
    );
  });

  it('should retry on error', async () => {
    const deferred = new Deferred();
    fetchMock.get(
      '/api/users/?limit=999&fullname_or_email__icontains=example&id_not_in=1',
      deferred.promise,
    );
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => jest.fn());

    const mockSetSelectedUser = jest.fn();
    render(
      wrapInIntlProvider(
        <SearchUserList
          searchedStr="example"
          setSelectedUser={mockSetSelectedUser}
          excludedUsers={['1']}
        />,
      ),
    );
    act(() => deferred.reject());
    await waitFor(async () =>
      expect(
        await screen.findByRole('button', { name: 'Retry' }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText('An error occurred, please try again later.'),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Retry',
      }),
    );
    expect(fetchMock.calls().length).toBe(2);
    expect(consoleError).toHaveBeenCalled();
  });
});

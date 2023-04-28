import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { render } from 'lib-tests';

import fetchMockAuth from '__mock__/fetchMockAuth.mock';
import { getLocalStorage } from 'utils/browser';

import { LoginForm } from './LoginForm';

const mockHistory = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    ...jest.requireActual('react-router-dom').useHistory(),
    replace: mockHistory,
  }),
}));

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<LoginFrom />', () => {
  beforeEach(() => {
    fetchMockAuth();
  });

  afterEach(() => {
    jest.resetAllMocks();
    consoleError.mockClear();
    fetchMock.restore();
  });

  it('checks render inputs and password reveals', () => {
    render(<LoginForm />);

    expect(
      screen.getByRole('textbox', { name: /username/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /OK/i })).toBeInTheDocument();

    const buttonHide = screen.getByRole('button', { name: /Hide/i });
    expect(buttonHide).toBeInTheDocument();

    userEvent.click(buttonHide);

    expect(screen.getByRole('button', { name: /View/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Hide/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /password/i }),
    ).toBeInTheDocument();
  });

  it('attempts to login: with fail', async () => {
    fetchMock.post('/account/api/token/', {
      status: 401,
      body: {
        detail: 'No active account found with the given credentials',
      },
    });
    render(<LoginForm />);

    userEvent.click(screen.getByRole('button', { name: /OK/i }));

    expect(
      screen.getAllByText(/This field is required to login./i),
    ).toHaveLength(2);

    userEvent.type(
      screen.getByRole('textbox', { name: /username/i }),
      'my_user',
    );
    userEvent.type(screen.getByLabelText(/password/i), 'my_pass');
    userEvent.click(screen.getByRole('button', { name: /OK/i }));

    expect(
      await screen.findByText(
        'No active account found with the given credentials',
      ),
    ).toBeInTheDocument();

    expect(consoleError).toHaveBeenCalled();

    expect(fetchMock.lastCall()![0]).toEqual('/account/api/token/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        username: 'my_user',
        password: 'my_pass',
      }),
    });
  });

  it('attempts to login: with success', async () => {
    fetchMock.post('/account/api/token/', {
      status: 200,
      ok: true,
    });
    render(<LoginForm />, {
      routerOptions: {
        history: ['/login'],
      },
    });

    userEvent.type(
      screen.getByRole('textbox', { name: /username/i }),
      'my_user',
    );
    userEvent.type(screen.getByLabelText(/password/i), 'my_pass');
    userEvent.click(screen.getByRole('button', { name: /OK/i }));

    await waitFor(() => expect(mockHistory).toHaveBeenCalledWith('/'));
  });

  it('checks the login redirection', async () => {
    fetchMock.post('/account/api/token/', {
      status: 200,
      ok: true,
    });
    render(<LoginForm />, {
      routerOptions: {
        history: ['/not-login-page'],
      },
    });

    await waitFor(() => expect(mockHistory).toHaveBeenCalledWith('/login'));

    expect(getLocalStorage()?.getItem('redirect_uri')).toEqual(
      '/not-login-page',
    );

    userEvent.type(
      screen.getByRole('textbox', { name: /username/i }),
      'my_user',
    );
    userEvent.type(screen.getByLabelText(/password/i), 'my_pass');
    userEvent.click(screen.getByRole('button', { name: /OK/i }));

    await waitFor(() =>
      expect(mockHistory).toHaveBeenCalledWith('/not-login-page'),
    );
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { render } from 'lib-tests';

import fetchMockAuth from '__mock__/fetchMockAuth.mock';
import { getLocalStorage } from 'utils/browser';

import { LoginForm } from './LoginForm';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('<LoginFrom />', () => {
  beforeEach(() => {
    fetchMockAuth();
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('checks render inputs and password reveals', async () => {
    render(<LoginForm />);

    expect(
      screen.getByRole('textbox', { name: /username/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /OK/i })).toBeInTheDocument();

    const buttonShow = screen.getByRole('button', { name: /Show/i });
    expect(buttonShow).toBeInTheDocument();

    await userEvent.click(buttonShow);

    expect(screen.getByRole('button', { name: /Hide/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Show/i }),
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

    await userEvent.click(screen.getByRole('button', { name: /OK/i }));

    await userEvent.type(
      screen.getByRole('textbox', { name: /username/i }),
      'my_user',
    );
    await userEvent.type(screen.getByLabelText('Password'), 'my_pass');
    await userEvent.click(screen.getByRole('button', { name: /OK/i }));

    expect(
      await screen.findByText(
        'No active account found with the given credentials',
      ),
    ).toBeInTheDocument();

    expect(fetchMock.lastCall()![0]).toEqual('/account/api/token/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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
        componentPath: '/my-path',
      },
    });

    await userEvent.type(
      screen.getByRole('textbox', { name: /username/i }),
      'my_user',
    );
    await userEvent.type(screen.getByLabelText('Password'), 'my_pass');
    await userEvent.click(screen.getByRole('button', { name: /OK/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/my-path'));
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

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));

    expect(getLocalStorage()?.getItem('redirect_uri')).toEqual(
      '/not-login-page',
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: /username/i }),
      'my_user',
    );
    await userEvent.type(screen.getByLabelText('Password'), 'my_pass');
    await userEvent.click(screen.getByRole('button', { name: /OK/i }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/not-login-page'),
    );
  });
});

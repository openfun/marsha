import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { render } from 'lib-tests';

import { Login } from './Login';

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

jest.spyOn(AbortController.prototype, 'abort');

jest.mock('./LoginForm', () => ({
  LoginForm: () => <div>My LoginForm</div>,
}));

jest.mock('./RenaterAuthenticator', () => ({
  RenaterAuthenticator: () => <div>My RenaterAuthenticator</div>,
}));

describe('<Login />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('checks render.', () => {
    render(<Login />);

    expect(screen.getByText(/My LoginForm/i)).toBeInTheDocument();
    expect(screen.getByText(/My RenaterAuthenticator/i)).toBeInTheDocument();
  });

  it('checks redirect if logged', async () => {
    useJwt.setState({
      refreshJwt: 'my refresh Jwt',
    });

    fetchMock.post('/account/api/token/refresh/', {
      access: 'my access',
      refresh: 'my refresh Jwt2',
    });

    render(<Login />);

    await waitFor(() => {
      expect(useJwt.getState().getJwt()).toBe('my access');
    });
    expect(useJwt.getState().getRefreshJwt()).toBe('my refresh Jwt2');
    expect(mockHistoryPush).toHaveBeenCalledWith('/');
  });

  it('checks no redirect if logged', async () => {
    useJwt.setState({
      refreshJwt: 'my refresh Jwt',
    });

    fetchMock.post('/account/api/token/refresh/', 400);

    render(<Login />);

    await waitFor(() => {
      expect(useJwt.getState().getJwt()).toBe(undefined);
    });
    expect(useJwt.getState().getRefreshJwt()).toBe(undefined);
    expect(screen.getByText(/My LoginForm/i)).toBeInTheDocument();
  });
});

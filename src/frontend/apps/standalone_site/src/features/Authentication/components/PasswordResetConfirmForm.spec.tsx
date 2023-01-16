import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { render } from 'lib-tests';

import { PasswordResetConfirmForm } from './PasswordResetConfirmForm';

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<PasswordResetConfirmForm />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    consoleError.mockClear();
    fetchMock.restore();
  });

  it('checks render inputs and password reveals', () => {
    render(<PasswordResetConfirmForm uid="some-uid" token="some-token" />);

    const [newPassword, newPasswordConfirm] =
      screen.getAllByLabelText(/Password/i);
    expect(newPassword).toBeInTheDocument();
    expect(newPasswordConfirm).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Reset my password/i }),
    ).toBeInTheDocument();

    const [hidePassword, hidePasswordConfirm] = screen.getAllByRole('button', {
      name: /Hide/i,
    });
    expect(hidePassword).toBeInTheDocument();
    expect(hidePasswordConfirm).toBeInTheDocument();

    userEvent.click(hidePassword);

    expect(screen.getByRole('button', { name: /View/i })).toBeInTheDocument(); // One password displayed
    expect(screen.getByRole('button', { name: /Hide/i })).toBeInTheDocument(); // The other password hidden
    expect(
      screen.getByRole('textbox', { name: /password/i }),
    ).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /Hide/i }));

    expect(screen.getAllByRole('button', { name: /View/i }).length).toEqual(2); // Both passwords displayed
    expect(
      screen.getByRole('textbox', { name: /password confirm/i }),
    ).toBeInTheDocument();
  });

  it('attempts to reset password and fails', async () => {
    fetchMock.post('/account/api/password/reset/confirm/', {
      status: 500,
    });
    render(<PasswordResetConfirmForm uid="some-uid" token="some-token" />);

    userEvent.click(screen.getByRole('button', { name: /Reset my password/i }));

    expect(screen.getAllByText(/This field is required./i)).toHaveLength(2);

    const [newPassword, newPasswordConfirm] =
      screen.getAllByLabelText(/Password/i);

    userEvent.type(newPassword, 'some-password');
    userEvent.type(newPasswordConfirm, 'some-password');

    userEvent.click(screen.getByRole('button', { name: /Reset my password/i }));

    expect(await screen.findByText('An error occurred')).toBeInTheDocument();

    expect(consoleError).toHaveBeenCalled();

    expect(fetchMock.lastCall()![0]).toEqual(
      '/account/api/password/reset/confirm/',
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        uid: 'some-uid',
        token: 'some-token',
        new_password1: 'some-password',
        new_password2: 'some-password',
      }),
    });
  });

  it('successfully reset password', async () => {
    fetchMock.post('/account/api/password/reset/confirm/', {
      status: 200,
      body: {
        detail: 'Password has been reset.',
      },
    });
    render(<PasswordResetConfirmForm uid="some-uid" token="some-token" />);

    const [newPassword, newPasswordConfirm] =
      screen.getAllByLabelText(/Password/i);

    userEvent.type(newPassword, 'some-password');
    userEvent.type(newPasswordConfirm, 'some-password');

    userEvent.click(screen.getByRole('button', { name: /Reset my password/i }));

    await waitFor(() => expect(mockHistoryPush).toHaveBeenCalledWith('/'));

    expect(
      screen.getByText('Password has been successfully reset.'),
    ).toBeInTheDocument();

    expect(fetchMock.lastCall()![0]).toEqual(
      '/account/api/password/reset/confirm/',
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        uid: 'some-uid',
        token: 'some-token',
        new_password1: 'some-password',
        new_password2: 'some-password',
      }),
    });
  });
});

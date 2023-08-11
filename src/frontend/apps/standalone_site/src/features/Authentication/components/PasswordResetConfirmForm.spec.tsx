import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { render } from 'lib-tests';

import { PasswordResetConfirmForm } from './PasswordResetConfirmForm';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('<PasswordResetConfirmForm />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('checks render inputs and password reveals', async () => {
    render(<PasswordResetConfirmForm uid="some-uid" token="some-token" />);

    const [newPassword, newPasswordConfirm] =
      screen.getAllByLabelText(/Password/i);
    expect(newPassword).toBeInTheDocument();
    expect(newPasswordConfirm).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Reset my password/i }),
    ).toBeInTheDocument();

    const [hidePassword, hidePasswordConfirm] = screen.getAllByRole('button', {
      name: /Show/i,
    });
    expect(hidePassword).toBeInTheDocument();
    expect(hidePasswordConfirm).toBeInTheDocument();

    await userEvent.click(hidePassword);

    expect(screen.getByRole('button', { name: /Hide/i })).toBeInTheDocument(); // One password displayed
    expect(screen.getByRole('button', { name: /Show/i })).toBeInTheDocument(); // The other password hidden
    expect(
      screen.getByRole('textbox', { name: /password/i }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Show/i }));

    expect(screen.getAllByRole('button', { name: /Hide/i }).length).toEqual(2); // Both passwords displayed
    expect(
      screen.getByRole('textbox', { name: /Confirm new password/i }),
    ).toBeInTheDocument();
  });

  it('attempts to reset password and fails', async () => {
    fetchMock.post('/account/api/password/reset/confirm/', {
      status: 500,
    });
    render(<PasswordResetConfirmForm uid="some-uid" token="some-token" />);

    await userEvent.click(
      screen.getByRole('button', { name: /Reset my password/i }),
    );

    const [newPassword, newPasswordConfirm] =
      screen.getAllByLabelText(/Password/i);

    await userEvent.type(newPassword, 'some-password');
    await userEvent.type(newPasswordConfirm, 'some-password');

    await userEvent.click(
      screen.getByRole('button', { name: /Reset my password/i }),
    );

    expect(await screen.findByText('An error occurred')).toBeInTheDocument();

    expect(fetchMock.lastCall()![0]).toEqual(
      '/account/api/password/reset/confirm/',
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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

    await userEvent.type(newPassword, 'some-password');
    await userEvent.type(newPasswordConfirm, 'some-password');

    await userEvent.click(
      screen.getByRole('button', { name: /Reset my password/i }),
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));

    expect(
      screen.getByText('Password has been successfully reset.'),
    ).toBeInTheDocument();

    expect(fetchMock.lastCall()![0]).toEqual(
      '/account/api/password/reset/confirm/',
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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

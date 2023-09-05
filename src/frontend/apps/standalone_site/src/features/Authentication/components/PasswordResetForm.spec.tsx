import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { render } from 'lib-tests';

import { PasswordResetForm } from './PasswordResetForm';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

describe('<PasswordResetForm />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    consoleError.mockClear();
    fetchMock.restore();
  });

  it('checks render inputs', async () => {
    render(<PasswordResetForm />);

    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /Reset my password/i }),
    );

    expect(screen.getByText('This field is required.')).toBeInTheDocument();
  });

  it('attempts to send reset password mail and fails', async () => {
    fetchMock.post('/account/api/password/reset/', {
      status: 500,
    });
    render(<PasswordResetForm />);

    await userEvent.type(
      screen.getByRole('textbox', { name: /email/i }),
      'john@example.com',
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Reset my password/i }),
    );

    expect(await screen.findByText('An error occurred')).toBeInTheDocument();

    expect(fetchMock.lastCall()![0]).toEqual('/account/api/password/reset/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'POST',
      body: JSON.stringify({
        confirm_url: 'http://localhost/auth/password-reset/confirm/',
        email: 'john@example.com',
      }),
    });
  });

  it('successfully sends reset password mail', async () => {
    fetchMock.post('/account/api/password/reset/', {
      status: 200,
      body: {
        detail: 'Password reset e-mail has been sent.',
      },
    });
    render(<PasswordResetForm />);

    await userEvent.type(
      screen.getByRole('textbox', { name: /email/i }),
      'john@example.com',
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Reset my password/i }),
    );

    expect(mockNavigate).toHaveBeenCalledWith('/');

    expect(
      screen.getByText('Password reset e-mail has been sent.'),
    ).toBeInTheDocument();
  });
});

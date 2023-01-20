import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { render } from 'lib-tests';
import { setLogger } from 'react-query';

import { AccountSettings } from './AccountSettings';

setLogger({
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

describe('<AccountSettings />', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  it('renders the update password form', async () => {
    render(<AccountSettings />);

    //  check form is render with its fields
    expect(
      screen.getByRole('heading', { name: 'Update my password' }),
    ).toBeInTheDocument();

    const currentPassword = screen.getByLabelText('Current password');
    expect(currentPassword).toBeInTheDocument();

    const newPassword = screen.getByLabelText('New password');
    expect(newPassword).toBeInTheDocument();

    const confirmationPassword = screen.getByLabelText('Repeat new password');
    expect(confirmationPassword).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    expect(submitButton).toBeInTheDocument();

    //  update fields values
    userEvent.type(currentPassword, 'previousPassword');
    userEvent.type(newPassword, 'newPassword');
    userEvent.type(confirmationPassword, 'newPassword');

    expect(
      await screen.findByDisplayValue('previousPassword'),
    ).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('newPassword').length).toEqual(2);

    //  submit the form
    fetchMock.mock('/account/api/password/change/', 200, { method: 'POST' });

    userEvent.click(submitButton);

    //  check final state
    await screen.findByText('Your password has been updated with success.');

    expect(
      screen.queryByDisplayValue('previousPassword'),
    ).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('newPassword')).not.toBeInTheDocument();
  });

  it('renders errors if update fails', async () => {
    render(<AccountSettings />);

    //  submit the form
    fetchMock.mock(
      '/account/api/password/change/',
      {
        throws: {
          old_password: ['old password error 1'],
          new_password1: ['new password error 1', 'new password error 2'],
        },
      },
      { method: 'POST' },
    );

    userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('old password error 1')).toBeInTheDocument();
    expect(
      await screen.findByText('new password error 1, new password error 2'),
    ).toBeInTheDocument();
  });
});

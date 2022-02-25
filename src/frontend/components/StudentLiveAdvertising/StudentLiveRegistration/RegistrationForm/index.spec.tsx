import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchMediaMock from 'jest-matchmedia-mock';
import React from 'react';

import { createLiveRegistration } from 'data/sideEffects/createLiveRegistration';
import { checkLtiToken } from 'utils/checkLtiToken';
import { liveRegistrationFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { RegistrationForm } from '.';

const setRegistrationCompleted = jest.fn();

let matchMedia: MatchMediaMock;

jest.mock('data/appData', () => ({
  getDecodedJwt: jest.fn(),
}));
jest.mock('utils/checkLtiToken', () => ({
  checkLtiToken: jest.fn(),
}));

const mockCheckLtiToken = checkLtiToken as jest.MockedFunction<
  typeof checkLtiToken
>;

jest.mock('data/sideEffects/createLiveRegistration', () => ({
  createLiveRegistration: jest.fn(),
}));
const mockCreateLiveRegistration =
  createLiveRegistration as jest.MockedFunction<typeof createLiveRegistration>;

describe('<RegistrationForm />', () => {
  beforeEach(() => {
    matchMedia = new MatchMediaMock();
    jest.clearAllMocks();
  });

  afterEach(() => {
    matchMedia.clear();
  });

  it('renders the form without values', () => {
    render(
      wrapInIntlProvider(
        <RegistrationForm
          setRegistrationCompleted={setRegistrationCompleted}
        />,
      ),
    );

    screen.getByRole('textbox', { name: 'Email address' });
    screen.getByRole('button', { name: 'Register' });
    expect(
      screen.queryByText('You have to submit a valid email to register.'),
    ).not.toBeInTheDocument();
  });

  it('renders the form with initial value', () => {
    render(
      wrapInIntlProvider(
        <RegistrationForm
          defaultEmail="some.email@openfun.fr"
          setRegistrationCompleted={setRegistrationCompleted}
        />,
      ),
    );

    screen.getByRole('textbox', { name: 'Email address' });
    screen.getByDisplayValue('some.email@openfun.fr');
    screen.getByRole('button', { name: 'Register' });
    expect(
      screen.queryByText('You have to submit a valid email to register.'),
    ).not.toBeInTheDocument();
  });

  it('calls parent on submit success', async () => {
    mockCheckLtiToken.mockReturnValue(true);
    const liveRegistration = liveRegistrationFactory({
      id: 'id',
      email: 'email',
      should_send_reminders: true,
      video: 'id',
    });
    mockCreateLiveRegistration.mockResolvedValue(liveRegistration);

    render(
      wrapInIntlProvider(
        <RegistrationForm
          defaultEmail="some.email@openfun.com"
          setRegistrationCompleted={setRegistrationCompleted}
        />,
      ),
    );

    expect(mockCreateLiveRegistration).toHaveBeenCalledTimes(0);
    expect(setRegistrationCompleted).toHaveBeenCalledTimes(0);

    userEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() =>
      expect(mockCreateLiveRegistration).toHaveBeenCalledTimes(1),
    );
    expect(setRegistrationCompleted).toHaveBeenCalledTimes(1);
  });

  it('renders the error when email is invalid', async () => {
    render(
      wrapInIntlProvider(
        <RegistrationForm
          defaultEmail="some.invalid.email@openfun."
          setRegistrationCompleted={setRegistrationCompleted}
        />,
      ),
    );

    screen.getByRole('textbox', { name: 'Email address' });
    screen.getByDisplayValue('some.invalid.email@openfun.');
    expect(
      screen.queryByText('You have to submit a valid email to register.'),
    ).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText('You have to submit a valid email to register.');
  });

  it('toasts an error when validation fail server side', async () => {
    mockCheckLtiToken.mockReturnValue(true);
    mockCreateLiveRegistration.mockResolvedValue(Promise.reject('some error'));

    render(
      wrapInIntlProvider(
        <RegistrationForm
          defaultEmail="some.email@openfun.fr"
          setRegistrationCompleted={setRegistrationCompleted}
        />,
      ),
    );

    screen.getByRole('textbox', { name: 'Email address' });
    screen.getByDisplayValue('some.email@openfun.fr');
    expect(
      screen.queryByText('You have to submit a valid email to register.'),
    ).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText(
      'Impossible to register your email some.email@openfun.fr for this event. Make sure your email is valid otherwise, please try again later or contact us.',
    );
  });
});

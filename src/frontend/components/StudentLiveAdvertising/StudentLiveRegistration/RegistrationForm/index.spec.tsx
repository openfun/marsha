import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchMediaMock from 'jest-matchmedia-mock';
import React from 'react';

import { getDecodedJwt } from 'data/appData';
import { createLiveSession } from 'data/sideEffects/createLiveSession';
import { liveSessionFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { RegistrationForm } from '.';

const setRegistrationCompleted = jest.fn();

let matchMedia: MatchMediaMock;

jest.mock('data/appData', () => ({
  getDecodedJwt: jest.fn(),
}));
const mockGetDecodedJwt = getDecodedJwt as jest.MockedFunction<
  typeof getDecodedJwt
>;

jest.mock('data/sideEffects/createLiveSession', () => ({
  createLiveSession: jest.fn(),
}));
const mockCreateLiveSession = createLiveSession as jest.MockedFunction<
  typeof createLiveSession
>;

describe('<RegistrationForm />', () => {
  beforeEach(() => {
    matchMedia = new MatchMediaMock();
    jest.clearAllMocks();

    mockGetDecodedJwt.mockReturnValue({
      consumer_site: 'consumer_site',
      locale: 'en',
      maintenance: false,
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
      resource_id: 'resource id',
      roles: ['student'],
      session_id: 'session id',
      user: {
        id: 'user_id',
        email: 'some email',
        username: 'user name',
        user_fullname: 'user full name',
      },
    });
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

  it('hides the field for lti user with email', async () => {
    mockGetDecodedJwt.mockReturnValue({
      consumer_site: 'consumer site',
      context_id: 'context id',
      locale: 'en',
      maintenance: false,
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
      resource_id: 'resource id',
      roles: ['student'],
      session_id: 'session id',
      user: {
        id: 'user_id',
        email: 'some email',
        username: 'user name',
        user_fullname: 'user full name',
      },
    });
    mockCreateLiveSession.mockResolvedValue(Promise.reject('some error'));

    render(
      wrapInIntlProvider(
        <RegistrationForm
          defaultEmail="some.email@openfun.fr"
          setRegistrationCompleted={setRegistrationCompleted}
        />,
      ),
    );

    expect(
      screen.queryByRole('textbox', { name: 'Email address' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'Impossible to register your email some.email@openfun.fr for this event. Make sure your email is valid otherwise, please try again later or contact us.',
      ),
    ).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText(
      'Impossible to register your email some.email@openfun.fr for this event. Make sure your email is valid otherwise, please try again later or contact us.',
    );

    const liveSession = liveSessionFactory({
      id: 'id',
      email: 'email',
      should_send_reminders: true,
      video: 'id',
    });
    mockCreateLiveSession.mockResolvedValue(liveSession);

    userEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() =>
      expect(setRegistrationCompleted).toHaveBeenCalledTimes(1),
    );

    expect(
      screen.queryByText(
        'Impossible to register your email some.email@openfun.fr for this event. Make sure your email is valid otherwise, please try again later or contact us.',
      ),
    ).not.toBeInTheDocument();
  });

  it('calls parent on submit success', async () => {
    const liveSession = liveSessionFactory({
      id: 'id',
      email: 'email',
      should_send_reminders: true,
      video: 'id',
    });
    mockCreateLiveSession.mockResolvedValue(liveSession);

    render(
      wrapInIntlProvider(
        <RegistrationForm
          defaultEmail="some.email@openfun.com"
          setRegistrationCompleted={setRegistrationCompleted}
        />,
      ),
    );

    expect(mockCreateLiveSession).toHaveBeenCalledTimes(0);
    expect(setRegistrationCompleted).toHaveBeenCalledTimes(0);

    userEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => expect(mockCreateLiveSession).toHaveBeenCalledTimes(1));
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

  it('renders an error when validation fail server side', async () => {
    mockCreateLiveSession.mockResolvedValue(Promise.reject('some error'));

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

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { createLiveSession } from 'data/sideEffects/createLiveSession';
import { getLiveSessions } from 'data/sideEffects/getLiveSessions';
import { DecodedJwt } from 'types/jwt';
import { liveSessionFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { StudentLiveRegistration } from '.';

let mockJwt: DecodedJwt;
jest.mock('data/appData', () => ({
  appData: {
    modelName: 'meetings',
    resource: {
      id: '1',
    },
  },
  getDecodedJwt: () => mockJwt,
}));

jest.mock('data/sideEffects/getLiveSessions', () => ({
  getLiveSessions: jest.fn(),
}));
const mockGetLiveSessions = getLiveSessions as jest.MockedFunction<
  typeof getLiveSessions
>;

jest.mock('data/sideEffects/createLiveSession', () => ({
  createLiveSession: jest.fn(),
}));
const mockCreateLiveSession = createLiveSession as jest.MockedFunction<
  typeof createLiveSession
>;

describe('<StudentLiveRegistration />', () => {
  beforeEach(() => {
    mockJwt = {
      consumer_site: 'a.site.fr',
      locale: 'en',
      maintenance: false,
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
      resource_id: 'ressource_id',
      roles: [],
      session_id: 'session_id',
      user: {
        id: 'user_id',
        username: 'username',
        user_fullname: 'hisName',
        email: 'test@openfun.fr',
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form and the message on submit', async () => {
    mockGetLiveSessions.mockResolvedValue({
      count: 0,
      results: [],
    });
    const liveSession = liveSessionFactory({
      id: 'id',
      is_registered: true,
      email: 'email',
      should_send_reminders: true,
      video: 'video_id',
    });
    mockCreateLiveSession.mockResolvedValue(liveSession);

    const { container } = render(
      wrapInIntlProvider(<StudentLiveRegistration />),
    );

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    screen.getByRole('textbox', { name: 'Email address' });
    screen.getByText('By registering, you accept to receive an email.');

    expect(container.childNodes.length).toEqual(1);

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText('You are successfully registered for this event.');
  });

  it('renders the form and an error when validation fail', async () => {
    mockJwt = {
      consumer_site: 'a.site.fr',
      locale: 'en',
      maintenance: false,
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
      resource_id: 'ressource_id',
      roles: [],
      session_id: 'session_id',
      user: {
        id: 'user_id',
        username: 'username',
        user_fullname: 'hisName',
        email: 'not_an_email',
      },
    };
    mockGetLiveSessions.mockResolvedValue({
      count: 0,
      results: [],
    });
    const { container } = render(
      wrapInIntlProvider(<StudentLiveRegistration />),
    );

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    screen.getByRole('textbox', { name: 'Email address' });
    screen.getByText('By registering, you accept to receive an email.');

    expect(container.childNodes.length).toEqual(1);

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText('You have to submit a valid email to register.');
    expect(mockCreateLiveSession).not.toHaveBeenCalled();
  });

  it('renders the form and the error when mail is already registered', async () => {
    mockGetLiveSessions.mockResolvedValue({
      count: 0,
      results: [],
    });
    mockCreateLiveSession.mockRejectedValue({
      email: ['blabla already registered'],
    });

    const { container } = render(
      wrapInIntlProvider(<StudentLiveRegistration />),
    );

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    screen.getByRole('textbox', { name: 'Email address' });
    screen.getByText('By registering, you accept to receive an email.');

    expect(container.childNodes.length).toEqual(1);

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText(
      'Impossible to register, test@openfun.fr is already registered for this event with another account.',
    );
  });

  it('renders the form and the error when an error occured with the email on backend', async () => {
    mockGetLiveSessions.mockResolvedValue({
      count: 0,
      results: [],
    });
    mockCreateLiveSession.mockRejectedValue({ email: 'something bad' });

    const { container } = render(
      wrapInIntlProvider(<StudentLiveRegistration />),
    );

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    screen.getByText('By registering, you accept to receive an email.');

    expect(container.childNodes.length).toEqual(1);

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText(
      'Impossible to register, test@openfun.fr is not valid.',
    );
  });

  it('renders the form and the error when an unknown error occured with the email on backend', async () => {
    mockGetLiveSessions.mockResolvedValue({
      count: 0,
      results: [],
    });
    mockCreateLiveSession.mockRejectedValue({});

    const { container } = render(
      wrapInIntlProvider(<StudentLiveRegistration />),
    );

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    screen.getByRole('textbox', { name: 'Email address' });
    screen.getByText('By registering, you accept to receive an email.');

    expect(container.childNodes.length).toEqual(1);

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText(
      'Impossible to register your email test@openfun.fr for this event. Make sure your email is valid otherwise, please try again later or contact us.',
    );
  });

  it('renders the form when a live session exists but is_registered false', async () => {
    const liveSession = liveSessionFactory({
      id: 'id',
      is_registered: false,
      email: 'email',
      should_send_reminders: true,
      video: 'video_id',
    });
    mockGetLiveSessions.mockResolvedValue({
      count: 1,
      results: [liveSession],
    });

    const { container } = render(
      wrapInIntlProvider(<StudentLiveRegistration />),
    );

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    screen.getByRole('textbox', { name: 'Email address' });
    screen.getByText('By registering, you accept to receive an email.');

    expect(container.childNodes.length).toEqual(1);
  });

  it('does not render if we fail to initialize current subscription for lti user', async () => {
    mockGetLiveSessions.mockRejectedValue(undefined);

    const { container } = render(
      wrapInIntlProvider(<StudentLiveRegistration />),
    );

    expect(container.childNodes.length).toEqual(0);
  });
});

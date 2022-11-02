import userEvent from '@testing-library/user-event';
import { fireEvent, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { decodeJwt, useCurrentUser, useJwt } from 'lib-components';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import { createLiveSession } from 'data/sideEffects/createLiveSession';
import { getAnonymousId } from 'utils/localstorage';
import { liveSessionFactory } from 'lib-components';
import render from 'utils/tests/render';

import { StudentLiveRegistration } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  modelName: 'videos',
  resource: {
    id: '1',
  },
}));

jest.mock('data/sideEffects/createLiveSession', () => ({
  createLiveSession: jest.fn(),
}));
const mockCreateLiveSession = createLiveSession as jest.MockedFunction<
  typeof createLiveSession
>;
jest.mock('utils/localstorage', () => ({
  getAnonymousId: jest.fn(),
}));
const mockGetAnonymousId = getAnonymousId as jest.MockedFunction<
  typeof getAnonymousId
>;

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  decodeJwt: jest.fn(),
}));
const mockedDecodeJwt = decodeJwt as jest.MockedFunction<typeof decodeJwt>;

describe('<StudentLiveRegistration />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
    });
    useCurrentUser.setState({
      currentUser: {
        email: null,
      } as any,
    });
    mockedDecodeJwt.mockReturnValue({
      consumer_site: 'a.site.fr',
      context_id: 'course-v1:ufr+mathematics+0001',
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
        email: null,
      },
    });
  });

  afterEach(() => {
    fetchMock.reset();
    jest.clearAllMocks();
  });

  it('renders the form and the message on submit', async () => {
    fetchMock.get('/api/livesessions/?limit=999', {
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

    const { container } = render(<StudentLiveRegistration />);

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    const emailField = screen.getByRole('textbox', { name: 'Email address' });
    userEvent.type(emailField, 'test@fun-mooc.fr');
    screen.getByText('By registering, you accept to receive an email.');

    expect(container.childNodes.length).toEqual(1);

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText('You are successfully registered for this event.');
  });

  it('renders the form and an error when validation fail', async () => {
    fetchMock.get('/api/livesessions/?limit=999', {
      count: 0,
      results: [],
    });
    const { container } = render(<StudentLiveRegistration />);

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    const emailField = screen.getByRole('textbox', { name: 'Email address' });
    userEvent.type(emailField, 'not_an_email');
    screen.getByText('By registering, you accept to receive an email.');

    expect(container.childNodes.length).toEqual(1);

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText('You have to submit a valid email to register.');
    expect(mockCreateLiveSession).not.toHaveBeenCalled();
  });

  it('renders the form and the error when mail is already registered', async () => {
    fetchMock.get('/api/livesessions/?limit=999', {
      count: 0,
      results: [],
    });
    mockCreateLiveSession.mockRejectedValue({
      email: ['blabla already registered'],
    });

    const { container } = render(<StudentLiveRegistration />);

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    const emailField = screen.getByRole('textbox', { name: 'Email address' });
    userEvent.type(emailField, 'test@openfun.fr');
    screen.getByText('By registering, you accept to receive an email.');

    expect(container.childNodes.length).toEqual(1);

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText(
      'Impossible to register, test@openfun.fr is already registered for this event with another account.',
    );
  });

  it('renders the form and the error when an error occured with the email on backend', async () => {
    fetchMock.get('/api/livesessions/?limit=999', {
      count: 0,
      results: [],
    });
    mockCreateLiveSession.mockRejectedValue({ email: 'something bad' });

    const { container } = render(<StudentLiveRegistration />);

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    const emailField = screen.getByRole('textbox', { name: 'Email address' });
    userEvent.type(emailField, 'test@openfun.fr');
    screen.getByText('By registering, you accept to receive an email.');

    expect(container.childNodes.length).toEqual(1);

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText(
      'Impossible to register, test@openfun.fr is not valid.',
    );
  });

  it('renders the form and the error when an unknown error occured with the email on backend', async () => {
    fetchMock.get('/api/livesessions/?limit=999', {
      count: 0,
      results: [],
    });
    mockCreateLiveSession.mockRejectedValue({});

    const { container } = render(<StudentLiveRegistration />);

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    const emailField = screen.getByRole('textbox', { name: 'Email address' });
    userEvent.type(emailField, 'test@openfun.fr');
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
    fetchMock.get('/api/livesessions/?limit=999', {
      count: 1,
      results: [liveSession],
    });

    const { container } = render(<StudentLiveRegistration />);

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    screen.getByRole('textbox', { name: 'Email address' });
    screen.getByText('By registering, you accept to receive an email.');

    expect(container.childNodes.length).toEqual(1);
  });

  it('renders the form using an anonymousId', async () => {
    mockedDecodeJwt.mockReturnValue({
      consumer_site: 'a.site.fr',
      context_id: 'course-v1:ufr+mathematics+0001',
      locale: 'en',
      maintenance: false,
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
      resource_id: 'ressource_id',
      roles: [],
      session_id: 'session_id',
      user: undefined,
    });
    useCurrentUser.setState({
      currentUser: undefined,
    });
    const liveSession = liveSessionFactory({
      id: 'id',
      is_registered: false,
      email: 'email',
      should_send_reminders: true,
      video: 'video_id',
    });
    const anonymousId = uuidv4();
    mockGetAnonymousId.mockReturnValue(anonymousId);
    fetchMock.get(`/api/livesessions/?limit=999&anonymous_id=${anonymousId}`, {
      count: 1,
      results: [liveSession],
    });

    const { container } = render(<StudentLiveRegistration />);

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    screen.getByRole('textbox', { name: 'Email address' });
    screen.getByText('By registering, you accept to receive an email.');

    expect(container.childNodes.length).toEqual(1);
  });
});

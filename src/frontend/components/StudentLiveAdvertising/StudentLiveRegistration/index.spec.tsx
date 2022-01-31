import { fireEvent, render, screen } from '@testing-library/react';
import MatchMediaMock from 'jest-matchmedia-mock';
import React, { Fragment } from 'react';
import { Toaster } from 'react-hot-toast';

import { fetchList } from 'data/queries/fetchList';
import { createLiveRegistration } from 'data/sideEffects/createLiveRegistration';
import { DecodedJwt } from 'types/jwt';
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

jest.mock('data/queries/fetchList', () => ({
  fetchList: jest.fn(),
}));
const mockFecthList = fetchList as jest.MockedFunction<typeof fetchList>;

jest.mock('data/sideEffects/createLiveRegistration', () => ({
  createLiveRegistration: jest.fn(),
}));
const mockCreateLiveRegistration =
  createLiveRegistration as jest.MockedFunction<typeof createLiveRegistration>;

let matchMedia: MatchMediaMock;

describe('<StudentLiveRegistration />', () => {
  beforeAll(() => {
    matchMedia = new MatchMediaMock();
  });
  afterEach(() => {
    matchMedia.clear();
    jest.clearAllMocks();
  });

  it('renders the form and the message on submit', async () => {
    mockJwt = {
      context_id: 'context_id',
      consumer_site: 'a.site.fr',
      email: 'an.email@openfun.fr',
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
    mockFecthList.mockResolvedValue(() => []);
    mockCreateLiveRegistration.mockImplementation(() =>
      Promise.resolve({
        id: 'id',
        email: 'email',
        should_send_reminders: true,
        video: 'video_id',
      }),
    );

    const { container } = render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <StudentLiveRegistration />
        </Fragment>,
      ),
    );

    expect(container.childNodes.length).toEqual(1);

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    screen.getByRole('heading', { name: 'Email address' });
    screen.getByRole('textbox');
    screen.getByText('By registering, you accept to receive an email.');

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText('You are successfully registered for this event.');
  });

  it('renders the form and an error when validation fail', async () => {
    mockJwt = {
      context_id: 'context_id',
      consumer_site: 'a.site.fr',
      email: 'an.email@openfun.fr',
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
    mockFecthList.mockResolvedValue(() => []);
    mockCreateLiveRegistration.mockImplementation(() =>
      Promise.resolve({
        id: 'id',
        email: 'email',
        should_send_reminders: true,
        video: 'video_id',
      }),
    );

    const { container } = render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <StudentLiveRegistration />
        </Fragment>,
      ),
    );

    expect(container.childNodes.length).toEqual(1);

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    screen.getByRole('heading', { name: 'Email address' });
    screen.getByRole('textbox');
    screen.getByText('By registering, you accept to receive an email.');

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText('You have to submit a valid email to register.');
  });

  it('renders the form and the error when mail is already registered', async () => {
    mockJwt = {
      context_id: 'context_id',
      consumer_site: 'a.site.fr',
      email: 'an.email@openfun.fr',
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
    mockFecthList.mockResolvedValue(() => []);
    mockCreateLiveRegistration.mockImplementation(() =>
      Promise.reject({ email: ['blabla already registered'] }),
    );

    const { container } = render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <StudentLiveRegistration />
        </Fragment>,
      ),
    );

    expect(container.childNodes.length).toEqual(1);

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    screen.getByRole('heading', { name: 'Email address' });
    screen.getByRole('textbox');
    screen.getByText('By registering, you accept to receive an email.');

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText(
      'Impossible to register, test@openfun.fr is already registered for this event with another account.',
    );
  });

  it('renders the form and the error when an error occured with the email on backend', async () => {
    mockJwt = {
      context_id: 'context_id',
      consumer_site: 'a.site.fr',
      email: 'an.email@openfun.fr',
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
    mockFecthList.mockResolvedValue(() => []);
    mockCreateLiveRegistration.mockImplementation(() =>
      Promise.reject({ email: 'something bad' }),
    );

    const { container } = render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <StudentLiveRegistration />
        </Fragment>,
      ),
    );

    expect(container.childNodes.length).toEqual(1);

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    screen.getByRole('heading', { name: 'Email address' });
    screen.getByRole('textbox');
    screen.getByText('By registering, you accept to receive an email.');

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText(
      'Impossible to register, test@openfun.fr is not valid.',
    );
  });

  it('renders the form and the error when an unknown error occured with the email on backend', async () => {
    mockJwt = {
      context_id: 'context_id',
      consumer_site: 'a.site.fr',
      email: 'an.email@openfun.fr',
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
    mockFecthList.mockResolvedValue(() => []);
    mockCreateLiveRegistration.mockImplementation(() => Promise.reject({}));

    const { container } = render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <StudentLiveRegistration />
        </Fragment>,
      ),
    );

    expect(container.childNodes.length).toEqual(1);

    await screen.findByRole('heading', {
      name: 'I want to subscribe to this webinar',
    });
    screen.getByRole('heading', { name: 'Email address' });
    screen.getByRole('textbox');
    screen.getByText('By registering, you accept to receive an email.');

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText(
      'Impossible to register your email test@openfun.fr for this event. Make sure your email is valid otherwise, please try again later or contact us.',
    );
  });

  it('does not render if we fail to initialize current subscription for lti user', async () => {
    mockJwt = {
      context_id: 'context_id',
      consumer_site: 'a.site.fr',
      email: 'an.email@openfun.fr',
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
    mockFecthList.mockRejectedValue(undefined);

    const { container } = render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <StudentLiveRegistration />
        </Fragment>,
      ),
    );

    expect(container.childNodes.length).toEqual(1);
  });
});

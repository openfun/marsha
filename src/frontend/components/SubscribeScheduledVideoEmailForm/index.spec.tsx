import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Deferred } from 'utils/tests/Deferred';
import { Grommet } from 'grommet';
import fetchMock from 'fetch-mock';
import React from 'react';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { SubscribeScheduledVideoEmailForm } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

describe('<SubscribeScheduledVideoEmailForm />', () => {
  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });
  it('shows the input for the email when prop email is not defined', () => {
    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideoEmailForm />
        </Grommet>,
      ),
    );
    screen.getByRole('textbox', { name: /type your email to subscribe/i });
    screen.getByRole('button', { name: /register/i });
  });
  it('shows the input for the email when email is null', () => {
    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideoEmailForm emailToken={null} />
        </Grommet>,
      ),
    );
    screen.getByRole('textbox', { name: /type your email to subscribe/i });
    screen.getByRole('button', { name: /register/i });
  });
  it('shows the input for the email when email is empty', () => {
    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideoEmailForm emailToken={''} />
        </Grommet>,
      ),
    );
    screen.getByRole('textbox', { name: /type your email to subscribe/i });
    screen.getByRole('button', { name: /register/i });
  });

  it('shows the register button and no input email form when email is defined in props', () => {
    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideoEmailForm
            emailToken={'chantal@fun-mooc.fr'}
          />
        </Grommet>,
      ),
    );
    expect(
      screen.queryByRole('textbox', { name: /type your email to subscribe/i }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: /register/i });
  });

  it('updates email when empty and shows effective changes', async () => {
    fetchMock.mock('/api/liveregistrations/', { method: 'POST' });
    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideoEmailForm emailToken={''} />
        </Grommet>,
      ),
    );
    const inputEmail = screen.getByRole('textbox', {
      name: /type your email to subscribe/i,
    });
    fireEvent.change(inputEmail, { target: { value: 'chantal@fun-mooc.fr' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/liveregistrations/', { method: 'POST' }),
      ).toBe(true);
    });
    const body = JSON.parse(
      fetchMock.lastOptions('/api/liveregistrations/')!.body!.toString(),
    );
    expect(body).toHaveProperty('email', 'chantal@fun-mooc.fr');
    expect(body).toHaveProperty('anonymous_id');
    screen.getByText(
      'Email chantal@fun-mooc.fr successfully registered for this event',
    );
  });
  it('updates email when prop email is not defined and shows effective changes', async () => {
    fetchMock.mock('/api/liveregistrations/', { method: 'POST' });
    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideoEmailForm />
        </Grommet>,
      ),
    );
    const inputEmail = screen.getByRole('textbox', {
      name: /type your email to subscribe/i,
    });
    fireEvent.change(inputEmail, { target: { value: 'chantal@fun-mooc.fr' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/liveregistrations/', { method: 'POST' }),
      ).toBe(true);
    });
    const body = JSON.parse(
      fetchMock.lastOptions('/api/liveregistrations/')!.body!.toString(),
    );
    expect(body).toHaveProperty('email', 'chantal@fun-mooc.fr');
    expect(body).toHaveProperty('anonymous_id');
    screen.getByText(
      'Email chantal@fun-mooc.fr successfully registered for this event',
    );
  });

  it('updates email when null and shows effective changes', async () => {
    fetchMock.mock('/api/liveregistrations/', { method: 'POST' });
    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideoEmailForm emailToken={null} />
        </Grommet>,
      ),
    );
    const inputEmail = screen.getByRole('textbox', {
      name: /type your email to subscribe/i,
    });
    fireEvent.change(inputEmail, { target: { value: 'chantal@fun-mooc.fr' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/liveregistrations/', { method: 'POST' }),
      ).toBe(true);
    });
    const body = JSON.parse(
      fetchMock.lastOptions('/api/liveregistrations/')!.body!.toString(),
    );
    expect(body).toHaveProperty('email', 'chantal@fun-mooc.fr');
    expect(body).toHaveProperty('anonymous_id');
    screen.getByText(
      'Email chantal@fun-mooc.fr successfully registered for this event',
    );
  });

  it('updates email when defined and register is pressed', async () => {
    fetchMock.mock('/api/liveregistrations/', { method: 'POST' });
    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideoEmailForm
            emailToken={'chantal@fun-mooc.fr'}
          />
        </Grommet>,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(
        fetchMock.called('/api/liveregistrations/', { method: 'POST' }),
      ).toBe(true);
    });
    const body = JSON.parse(
      fetchMock.lastOptions('/api/liveregistrations/')!.body!.toString(),
    );
    expect(body).toHaveProperty('email', 'chantal@fun-mooc.fr');
    expect(body).toHaveProperty('anonymous_id');
    screen.getByText(
      'Email chantal@fun-mooc.fr successfully registered for this event',
    );
  });

  it('fails with an existing email', async () => {
    const deferred = new Deferred();
    fetchMock.mock('/api/liveregistrations/', deferred.promise, {
      method: 'POST',
    });

    const { getByText, getByRole } = render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideoEmailForm emailToken={''} />
        </Grommet>,
      ),
    );
    getByRole('button', { name: /register/i });
    const inputEmail = getByRole('textbox', {
      name: /type your email to subscribe/i,
    });
    fireEvent.change(inputEmail, { target: { value: 'chantal@fun-mooc.fr' } });
    fireEvent.click(getByRole('button', { name: /register/i }));
    await act(async () =>
      deferred.resolve({
        status: 400,
        body: {
          email: ['chantal@fun-mooc.fr is already registered for ...'],
        },
      }),
    );
    expect(
      fetchMock.called('/api/liveregistrations/', { method: 'POST' }),
    ).toBe(true);
    const body = JSON.parse(
      fetchMock.lastOptions('/api/liveregistrations/')!.body!.toString(),
    );
    expect(body).toHaveProperty('email', 'chantal@fun-mooc.fr');
    expect(body).toHaveProperty('anonymous_id');

    getByText(
      'Impossible to register, chantal@fun-mooc.fr is already registered for this event with another account.',
    );
  });

  it('fails with a non valid email', async () => {
    const deferred = new Deferred();
    fetchMock.mock('/api/liveregistrations/', deferred.promise, {
      method: 'POST',
    });

    const { getByText, getByRole } = render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideoEmailForm emailToken={''} />
        </Grommet>,
      ),
    );
    getByRole('button', { name: /register/i });
    const inputEmail = getByRole('textbox', {
      name: /type your email to subscribe/i,
    });
    fireEvent.change(inputEmail, { target: { value: 'chantal' } });
    fireEvent.click(getByRole('button', { name: /register/i }));
    await act(async () =>
      deferred.resolve({
        status: 400,
        body: {
          email: ['wrong'],
        },
      }),
    );
    expect(
      fetchMock.called('/api/liveregistrations/', { method: 'POST' }),
    ).toBe(true);
    const body = JSON.parse(
      fetchMock.lastOptions('/api/liveregistrations/')!.body!.toString(),
    );
    expect(body).toHaveProperty('email', 'chantal');
    expect(body).toHaveProperty('anonymous_id');

    getByText('Impossible to register, chantal is not valid.');
  });

  it('fails with a non valid request', async () => {
    const deferred = new Deferred();
    fetchMock.mock('/api/liveregistrations/', deferred.promise, {
      method: 'POST',
    });

    const { getByText, getByRole } = render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideoEmailForm emailToken={''} />
        </Grommet>,
      ),
    );
    getByRole('button', { name: /register/i });
    const inputEmail = getByRole('textbox', {
      name: /type your email to subscribe/i,
    });
    fireEvent.change(inputEmail, { target: { value: 'chantal@aol.com' } });
    fireEvent.click(getByRole('button', { name: /register/i }));
    await act(async () => deferred.reject(500));
    expect(
      fetchMock.called('/api/liveregistrations/', { method: 'POST' }),
    ).toBe(true);
    const body = JSON.parse(
      fetchMock.lastOptions('/api/liveregistrations/')!.body!.toString(),
    );
    expect(body).toHaveProperty('email', 'chantal@aol.com');
    expect(body).toHaveProperty('anonymous_id');

    getByText(
      'Impossible to register your email chantal@aol.com for this event. Make sure your email is valid otherwise, please try again later or contact us.',
    );
  });
});

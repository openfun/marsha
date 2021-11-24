import {
  act,
  fireEvent,
  render,
  waitFor,
  screen,
} from '@testing-library/react';
import { Grommet } from 'grommet';
import { videoMockFactory } from 'utils/tests/factories';
import fetchMock from 'fetch-mock';
import React from 'react';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { SubscribeScheduledVideo } from '.';
let mockDecodedJwt: any;
jest.mock('jwt-decode', () => jest.fn());
jest.mock('data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
  getDecodedJwt: () => mockDecodedJwt,
}));
jest.mock('index', () => ({
  intl: {
    locale: 'en',
  },
}));
const video = videoMockFactory();
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 10);

describe('<SubscribeScheduledVideo />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    fetchMock.restore();
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('shows the waiting screen when loaded time is past', async () => {
    mockDecodedJwt = {};
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 10);

    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideo
            video={{ ...video, starting_at: pastDate.toISOString() }}
          />
        </Grommet>,
      ),
    );
    await screen.findByRole('heading', { name: /live will begin soon/i });
  });

  it('shows the waiting screen when time gets past after loading', async () => {
    mockDecodedJwt = {};
    const startingAt = new Date();
    startingAt.setMinutes(startingAt.getMinutes() + 5);

    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideo
            video={{ ...video, starting_at: startingAt.toISOString() }}
          />
        </Grommet>,
      ),
    );
    // first you can register
    await screen.findByRole('button', { name: /register/i });
    act(() => {
      // advance time by 5 minutes and 30 seconds
      jest.advanceTimersByTime(1000 * (60 * 5 + 30));
    });
    // now you get the waiting screen
    await screen.findByRole('heading', { name: /live will begin soon/i });
    expect(
      screen.queryByRole('button', { name: /register/i }),
    ).not.toBeInTheDocument();
  });

  it('shows the registration form with an input email if token is empty and days change', async () => {
    mockDecodedJwt = {};
    const startingAt = new Date();
    startingAt.setDate(startingAt.getDate() + 2);
    startingAt.setMinutes(startingAt.getMinutes() + 1);
    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideo
            video={{
              ...video,
              title: 'Maths',
              description: 'Learn about equations',
              starting_at: startingAt.toISOString(),
            }}
          />
        </Grommet>,
      ),
    );

    await screen.findByRole('button', { name: /register/i });
    screen.getByRole('heading', {
      name: `Register to this event starting on ${startingAt.toLocaleString(
        'en',
      )}`,
    });
    screen.getByRole('heading', {
      name: /days left 2 days 0 0 : 0 1 : 0 0/i,
    });
    screen.getByRole('textbox', { name: /type your email to subscribe/i });
    screen.queryByText('Learn about equations');
    screen.queryByText('Maths');
    act(() => {
      // advance time by 2 minutes and one second and few milliseconds to avoid the
      // div added by the component Clock while digits are changing
      jest.advanceTimersByTime(1000 * (60 * 2 + 1) + 25);
    });
    await screen.findByRole('heading', {
      name: /days left 1 day 2 3 : 5 8 : 5 9/i,
    });
  });

  it('shows singular for 0 day', async () => {
    mockDecodedJwt = {};
    const startingAt = new Date();
    startingAt.setHours(startingAt.getHours() + 11);
    startingAt.setMinutes(startingAt.getMinutes() + 24);
    startingAt.setSeconds(startingAt.getSeconds() + 30);
    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideo
            video={{
              ...video,
              starting_at: startingAt.toISOString(),
            }}
          />
        </Grommet>,
      ),
    );

    await screen.findByRole('button', { name: /register/i });
    screen.getByRole('heading', {
      name: `Register to this event starting on ${startingAt.toLocaleString(
        'en',
      )}`,
    });
    screen.getByRole('heading', {
      name: /days left 0 day 1 1 : 2 4 : 3 0/i,
    });
  });

  it('calls the API if token has email', async () => {
    mockDecodedJwt = {
      user: {
        email: 'chantal@fun-mooc.fr',
      },
    };
    fetchMock.get('/api/liveregistrations/?limit=999', {
      count: 0,
    });
    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideo
            video={{
              ...video,
              starting_at: futureDate.toISOString(),
            }}
          />
        </Grommet>,
      ),
    );
    // API gets called
    await waitFor(() => {
      expect(
        fetchMock.called('/api/liveregistrations/?limit=999', {
          method: 'GET',
        }),
      ).toBe(true);
    });
  });

  it("doesn't call the API if token is empty", async () => {
    mockDecodedJwt = {};
    fetchMock.get('/api/liveregistrations/?limit=999', {
      count: 0,
    });
    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideo
            video={{
              ...video,
              starting_at: futureDate.toISOString(),
            }}
          />
        </Grommet>,
      ),
    );

    await screen.findByRole('button', { name: /register/i });
    // API doesn't get called
    expect(
      fetchMock.called('/api/liveregistrations/?limit=999', {
        method: 'GET',
      }),
    ).toBe(false);
  });

  it("doesn't call the API if token has only user.id", async () => {
    mockDecodedJwt = {
      user: {
        id: '6767',
      },
    };
    fetchMock.get('/api/liveregistrations/?limit=999', {
      count: 0,
    });
    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideo
            video={{
              ...video,
              starting_at: futureDate.toISOString(),
            }}
          />
        </Grommet>,
      ),
    );
    await screen.findByRole('button', { name: /register/i });
    // API is not called
    expect(
      fetchMock.called('/api/liveregistrations/?limit=999', {
        method: 'GET',
      }),
    ).toBe(false);
  });

  it("doesn't call the API if token has only context_id", async () => {
    mockDecodedJwt = { context_id: '777' };

    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideo
            video={{
              ...video,
              starting_at: futureDate.toISOString(),
            }}
          />
        </Grommet>,
      ),
    );
    await screen.findByRole('button', { name: /register/i });
    // API is not called
    expect(
      fetchMock.called('/api/liveregistrations/?limit=999', { method: 'GET' }),
    ).toBe(false);
  });

  it("doesn't call the API if token has user.id and context_id", async () => {
    fetchMock.get('/api/liveregistrations/?limit=999', { count: 0 });
    mockDecodedJwt = { context_id: '777' };

    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideo
            video={{
              ...video,
              starting_at: futureDate.toISOString(),
            }}
          />
        </Grommet>,
      ),
    );
    await screen.findByRole('button', { name: /register/i });
    // API doesn't get called
    expect(
      fetchMock.called('/api/liveregistrations/?limit=999', {
        method: 'GET',
      }),
    ).toBe(false);
  });

  it('shows the registration form without an input email if token has email', async () => {
    mockDecodedJwt = {
      user: {
        email: 'chantal@fun-mooc.fr',
      },
    };
    fetchMock.get('/api/liveregistrations/?limit=999', {
      count: 0,
    });
    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideo
            video={{
              ...video,
              description: 'nice webinar',
              starting_at: futureDate.toISOString(),
            }}
          />
        </Grommet>,
      ),
    );

    await screen.findByRole('button', { name: /register/i });
    expect(
      screen.queryByRole('textbox', { name: /type your email to subscribe/i }),
    ).not.toBeInTheDocument();
    screen.queryByText('nice webinar');
    screen.getByRole('heading', {
      name: `Register to this event starting on ${futureDate.toLocaleString(
        'en',
      )}`,
    });
  });

  it('shows the user is already registered', async () => {
    mockDecodedJwt = {
      user: {
        email: 'chantal@fun-mooc.fr',
      },
    };
    fetchMock.get('/api/liveregistrations/?limit=999', {
      count: 1,
    });
    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideo
            video={{
              ...video,
              starting_at: futureDate.toISOString(),
            }}
          />
        </Grommet>,
      ),
    );

    await screen.findByRole('heading', { name: video.title });
    screen.queryByText(
      `You are registered for this event. Live will start at ${futureDate.toLocaleString(
        'en',
      )}`,
    );

    expect(
      screen.queryByRole('textbox', { name: /type your email to subscribe/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /register/i }),
    ).not.toBeInTheDocument();
  });

  it('subscribes a user with email in the token', async () => {
    fetchMock.mock('/api/liveregistrations/', { method: 'POST' });
    fetchMock.get('/api/liveregistrations/?limit=999', {
      count: 0,
    });
    mockDecodedJwt = {
      user: {
        email: 'chantal@fun-mooc.fr',
      },
    };

    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideo
            video={{
              ...video,
              starting_at: futureDate.toISOString(),
            }}
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
    expect(fetchMock.lastOptions('/api/liveregistrations/')!.body).toEqual(
      '{"email":"chantal@fun-mooc.fr"}',
    );
    screen.getByText(
      'Email chantal@fun-mooc.fr successfully registered for this event',
    );
  });

  it('subscribes an user with no token', async () => {
    fetchMock.mock('/api/liveregistrations/', { method: 'POST' });
    fetchMock.get('/api/liveregistrations/?limit=999', {
      count: 0,
    });
    mockDecodedJwt = {};

    render(
      wrapInIntlProvider(
        <Grommet>
          <SubscribeScheduledVideo
            video={{
              ...video,
              starting_at: futureDate.toISOString(),
            }}
          />
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
    expect(fetchMock.lastOptions('/api/liveregistrations/')!.body).toEqual(
      '{"email":"chantal@fun-mooc.fr"}',
    );
    screen.getByText(
      'Email chantal@fun-mooc.fr successfully registered for this event',
    );
  });
});

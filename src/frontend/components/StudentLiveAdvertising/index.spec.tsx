import { cleanup, render, screen } from '@testing-library/react';
import { DateTime } from 'luxon';
import React, { Fragment } from 'react';
import { Toaster } from 'react-hot-toast';
import { liveState } from 'types/tracks';

import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { StudentLiveAdvertising } from '.';

jest.mock('data/appData', () => ({
  appData: {
    modelName: 'meetings',
    resource: {
      id: '1',
    },
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  },
  getDecodedJwt: () => ({
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
  }),
}));

jest.mock('data/sideEffects/getLiveSessions', () => ({
  getLiveSessions: async () => ({
    count: 0,
    results: [],
  }),
}));

describe('<StudentLiveAdvertising />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    //    set system date to 2022-01-27T14:00:00
    jest.setSystemTime(new Date(2022, 1, 27, 14, 0, 0));
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it('renders live information when live is not starting and not running and starting_at is null', () => {
    const states = Object.values(liveState).filter(
      (state) => ![liveState.STARTING, liveState.RUNNING].includes(state),
    );

    states.forEach((state) => {
      const video = videoMockFactory({
        live_state: state,
        starting_at: undefined,
        title: 'live title',
        description: 'live description',
      });

      render(
        wrapInIntlProvider(
          <Fragment>
            <Toaster />
            <StudentLiveAdvertising video={video} />
          </Fragment>,
        ),
      );

      screen.getByRole('heading', { name: 'live title' });
      screen.getByText('live description');

      cleanup();
    });
  });

  it('renders live information, schedule and register form when live is idling and starting_at is in the future', async () => {
    const video = videoMockFactory({
      starting_at: DateTime.fromJSDate(new Date(2022, 1, 29, 11, 0, 0)).toISO(),
      live_state: liveState.IDLE,
      title: 'live title',
      description: 'live description',
    });

    render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <StudentLiveAdvertising video={video} />
        </Fragment>,
      ),
    );

    await screen.findByRole('button', { name: 'Register' });

    screen.getByRole('heading', { name: 'live title' });
    screen.getByText('live description');

    screen.getByRole('heading', {
      name: 'Live will start in 2 days at 11:00 AM',
    });
  });

  it('renders live information only when live is not STARTING or RUNNING', async () => {
    const states = [liveState.STARTING, liveState.RUNNING];

    states.forEach((state) => {
      const video = videoMockFactory({
        starting_at: DateTime.fromJSDate(
          new Date(2022, 1, 29, 11, 0, 0),
        ).toISO(),
        live_state: state,
        title: 'live title',
        description: 'live description',
      });

      render(
        wrapInIntlProvider(
          <Fragment>
            <Toaster />
            <StudentLiveAdvertising video={video} />
          </Fragment>,
        ),
      );

      expect(
        screen.queryByRole('button', { name: 'Register' }),
      ).not.toBeInTheDocument();

      screen.getByRole('heading', { name: 'live title' });
      screen.getByText('live description');

      screen.getByRole('heading', {
        name: 'Live is starting',
      });

      cleanup();
    });
  });

  it('renders live information only when live is idling and starting_at is in the past', async () => {
    const video = videoMockFactory({
      starting_at: DateTime.fromJSDate(new Date(2022, 1, 25, 11, 0, 0)).toISO(),
      live_state: liveState.IDLE,
      title: 'live title',
      description: 'live description',
    });

    render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <StudentLiveAdvertising video={video} />
        </Fragment>,
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Register' }),
    ).not.toBeInTheDocument();

    screen.getByRole('heading', { name: 'live title' });
    screen.getByText('live description');

    screen.getByRole('heading', {
      name: 'Live is starting',
    });
  });
});

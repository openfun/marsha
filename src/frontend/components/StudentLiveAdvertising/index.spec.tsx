import { cleanup, screen } from '@testing-library/react';
import faker from 'faker';
import { DateTime } from 'luxon';
import React from 'react';

import { liveState } from 'types/tracks';
import { thumbnailMockFactory, videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import { StudentLiveAdvertising } from '.';

jest.mock('data/appData', () => ({
  appData: {
    modelName: 'videos',
    resource: {
      id: '1',
    },
    static: {
      img: {
        liveBackground: 'path/to/image.png',
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

      render(<StudentLiveAdvertising video={video} />);

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

    render(<StudentLiveAdvertising video={video} />);

    await screen.findByRole('button', { name: 'Register' });

    screen.getByRole('heading', { name: 'live title' });
    screen.getByText('live description');

    screen.getByRole('heading', {
      name: 'Live will start in 2 days at 11:00 AM',
    });
  });

  it('renders live information only when live is not STARTING or RUNNING', () => {
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

      render(<StudentLiveAdvertising video={video} />);

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

  it('renders live information only when live is idling and starting_at is in the past', () => {
    const video = videoMockFactory({
      starting_at: DateTime.fromJSDate(new Date(2022, 1, 25, 11, 0, 0)).toISO(),
      live_state: liveState.IDLE,
      title: 'live title',
      description: 'live description',
    });

    render(<StudentLiveAdvertising video={video} />);

    expect(
      screen.queryByRole('button', { name: 'Register' }),
    ).not.toBeInTheDocument();

    screen.getByRole('heading', { name: 'live title' });
    screen.getByText('live description');

    screen.getByRole('heading', {
      name: 'Live is starting',
    });
  });

  it('renders live information with no uploaded thumbnail', () => {
    const video = videoMockFactory({
      starting_at: DateTime.fromJSDate(new Date(2022, 1, 25, 11, 0, 0)).toISO(),
      live_state: liveState.IDLE,
      title: 'live title',
      description: 'live description',
    });

    render(<StudentLiveAdvertising video={video} />);

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toEqual('path/to/image.png');
  });

  it('renders live information with uploaded thumbnail but with no urls', () => {
    const videoId = faker.datatype.uuid();
    const video = videoMockFactory({
      id: videoId,
      starting_at: DateTime.fromJSDate(new Date(2022, 1, 25, 11, 0, 0)).toISO(),
      live_state: liveState.IDLE,
      title: 'live title',
      description: 'live description',
      thumbnail: thumbnailMockFactory({
        is_ready_to_show: true,
        video: videoId,
        urls: undefined,
      }),
    });

    render(<StudentLiveAdvertising video={video} />);

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toEqual('path/to/image.png');
  });

  it('renders live information with an uploaded thumbnail', () => {
    const videoId = faker.datatype.uuid();
    const video = videoMockFactory({
      id: videoId,
      starting_at: DateTime.fromJSDate(new Date(2022, 1, 25, 11, 0, 0)).toISO(),
      live_state: liveState.IDLE,
      title: 'live title',
      description: 'live description',
      thumbnail: thumbnailMockFactory({
        video: videoId,
      }),
    });

    render(<StudentLiveAdvertising video={video} />);

    const img = screen.getByRole('img', { name: 'Live video thumbnail' });
    expect(img.getAttribute('src')).toEqual(
      'https://example.com/default_thumbnail/144',
    );
    expect(img.getAttribute('srcset')).toEqual(
      'https://example.com/default_thumbnail/144 256w, https://example.com/default_thumbnail/240 426w, https://example.com/default_thumbnail/480 854w, https://example.com/default_thumbnail/720 1280w, https://example.com/default_thumbnail/1080 1920w',
    );
  });
});

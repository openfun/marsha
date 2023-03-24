import { cleanup, screen } from '@testing-library/react';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import {
  useCurrentUser,
  liveState,
  liveSessionFactory,
  thumbnailMockFactory,
  liveMockFactory,
  LiveModeType,
} from 'lib-components';
import { render, Deferred } from 'lib-tests';
import { DateTime, Duration } from 'luxon';
import React from 'react';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { StudentLiveAdvertising } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    modelName: 'videos',
    resource: {
      id: '1',
    },
    static: {
      img: {
        liveBackground: 'path/to/image.png',
      },
    },
  }),
  decodeJwt: () => ({
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
      full_name: 'hisName',
      email: 'test@openfun.fr',
    },
  }),
}));

jest.mock(
  'react-icalendar-link',
  () =>
    (props: {
      event: {
        description: string;
        endTime: string;
        startTime: string;
        title: string;
        url: string;
      };
    }) => {
      return (
        <span>
          <span>Add to my calendar</span>
          <span>description:{props.event.description}</span>
          <span>title:{props.event.title}</span>
          <span>startTime:{props.event.startTime}</span>
          <span>endlive:{props.event.endTime}</span>
          {props.event.url && <span>url:{props.event.url}</span>}
        </span>
      );
    },
);

describe('<StudentLiveAdvertising />', () => {
  const nextYear = new Date().getFullYear() + 1;

  beforeEach(() => {
    jest.useFakeTimers();
    //    set system date to 2022-01-27T14:00:00
    jest.setSystemTime(new Date(2022, 1, 27, 14, 0, 0));

    useCurrentUser.setState({
      currentUser: {
        email: 'an.email@openfun.fr',
      } as any,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('renders live information when live is not starting and not running and starting_at is null', () => {
    const {
      RUNNING: _running,
      ENDED: _ended,
      STARTING: _starting,
      ...state
    } = liveState;
    const states = Object.values(state);

    states.forEach((state) => {
      const video = liveMockFactory({
        live_state: state,
        starting_at: undefined,
        title: 'live title',
        description: 'live description',
        live_type: LiveModeType.JITSI,
      });

      render(wrapInVideo(<StudentLiveAdvertising />, video));

      expect(
        screen.getByRole('heading', { name: 'live title' }),
      ).toBeInTheDocument();
      expect(screen.getByText('live description')).toBeInTheDocument();

      cleanup();
    });
  });

  it('renders live information, schedule and register form when live is idling and starting_at is in the future', async () => {
    const video = liveMockFactory({
      starting_at: DateTime.fromJSDate(new Date(2022, 1, 29, 11, 0, 0)).toISO(),
      live_state: liveState.IDLE,
      title: 'live title',
      description: 'live description',
      live_type: LiveModeType.JITSI,
    });

    const deferred = new Deferred();
    fetchMock.get(
      `/api/videos/${video.id}/livesessions/?limit=999`,
      deferred.promise,
    );

    render(wrapInVideo(<StudentLiveAdvertising />, video));

    deferred.resolve({
      count: 1,
      next: '',
      previous: '',
      results: [liveSessionFactory({ is_registered: false })],
    });

    expect(
      await screen.findByRole('button', { name: 'Register' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'live title' }),
    ).toBeInTheDocument();
    expect(screen.getByText('live description')).toBeInTheDocument();

    expect(
      screen.getByRole('heading', {
        name: 'Live will start in 2 days at 11:00 AM',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Add to my calendar')).toBeInTheDocument();
  });

  it('renders live information only when live is not STARTING or RUNNING', () => {
    const states = [liveState.STARTING, liveState.RUNNING] as const;

    states.forEach((state) => {
      const video = liveMockFactory({
        starting_at: DateTime.fromJSDate(
          new Date(2022, 1, 29, 11, 0, 0),
        ).toISO(),
        live_state: state,
        title: 'live title',
        description: 'live description',
        live_type: LiveModeType.JITSI,
      });

      render(wrapInVideo(<StudentLiveAdvertising />, video));

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
    const video = liveMockFactory({
      starting_at: DateTime.fromJSDate(new Date(2022, 1, 25, 11, 0, 0)).toISO(),
      title: 'live title',
      description: 'live description',
    });

    render(wrapInVideo(<StudentLiveAdvertising />, video));

    expect(
      screen.queryByRole('button', { name: 'Register' }),
    ).not.toBeInTheDocument();

    screen.getByRole('heading', { name: 'live title' });
    screen.getByText('live description');

    screen.getByRole('heading', {
      name: 'Live is starting',
    });
    expect(screen.queryByText('Add to my calendar')).not.toBeInTheDocument();
  });

  it('renders live information only when live is stopping and starting_at is in the past', () => {
    const video = liveMockFactory({
      starting_at: DateTime.fromJSDate(new Date(2022, 1, 25, 11, 0, 0)).toISO(),
      live_state: liveState.STOPPING,
      title: 'live title',
      description: 'live description',
    });

    fetchMock.get(`/api/videos/${video.id}/livesessions/?limit=999`, []);

    render(wrapInVideo(<StudentLiveAdvertising />, video));

    expect(
      screen.queryByRole('button', { name: 'Register' }),
    ).not.toBeInTheDocument();

    screen.getByRole('heading', { name: 'live title' });
    screen.getByText('live description');

    screen.getByRole('heading', {
      name: 'This live has ended',
    });
    expect(screen.queryByText('Add to my calendar')).not.toBeInTheDocument();
  });

  it('renders live information with no uploaded thumbnail', () => {
    const video = liveMockFactory({
      starting_at: DateTime.fromJSDate(new Date(2022, 1, 25, 11, 0, 0)).toISO(),
      title: 'live title',
      description: 'live description',
    });

    render(wrapInVideo(<StudentLiveAdvertising />, video));

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toEqual('path/to/image.png');
  });

  it('renders live information with uploaded thumbnail but with no urls', () => {
    const videoId = faker.datatype.uuid();
    const video = liveMockFactory({
      id: videoId,
      starting_at: DateTime.fromJSDate(
        new Date(nextYear, 1, 25, 11, 0, 0),
      ).toISO(),
      title: 'live title',
      description: 'live description',
      thumbnail: thumbnailMockFactory({
        is_ready_to_show: true,
        video: videoId,
        urls: undefined,
      }),
    });

    fetchMock.get(`/api/videos/${video.id}/livesessions/?limit=999`, []);

    render(wrapInVideo(<StudentLiveAdvertising />, video));

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toEqual('path/to/image.png');
    screen.getByText('Add to my calendar');
  });

  it('renders live information with uploaded thumbnail but with no urls and past scheduled', () => {
    const videoId = faker.datatype.uuid();
    const video = liveMockFactory({
      id: videoId,
      starting_at: DateTime.fromJSDate(new Date(2022, 1, 25, 11, 0, 0)).toISO(),
      title: 'live title',
      description: 'live description',
      thumbnail: thumbnailMockFactory({
        is_ready_to_show: true,
        video: videoId,
        urls: undefined,
      }),
    });

    render(wrapInVideo(<StudentLiveAdvertising />, video));

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toEqual('path/to/image.png');
    expect(screen.queryByText('Add to my calendar')).not.toBeInTheDocument();
  });

  it('renders live information with an uploaded thumbnail', () => {
    const videoId = faker.datatype.uuid();
    const video = liveMockFactory({
      id: videoId,
      starting_at: DateTime.fromJSDate(
        new Date(nextYear, 1, 25, 11, 0, 0),
      ).toISO(),
      title: 'live title',
      description: 'live description',
      thumbnail: thumbnailMockFactory({
        video: videoId,
      }),
    });

    fetchMock.get(`/api/videos/${video.id}/livesessions/?limit=999`, []);

    render(wrapInVideo(<StudentLiveAdvertising />, video));

    const img = screen.getByRole('img', { name: 'Live video thumbnail' });
    expect(img.getAttribute('src')).toEqual(
      'https://example.com/default_thumbnail/144',
    );
    expect(img.getAttribute('srcset')).toEqual(
      'https://example.com/default_thumbnail/144 256w, https://example.com/default_thumbnail/240 426w, https://example.com/default_thumbnail/480 854w, https://example.com/default_thumbnail/720 1280w, https://example.com/default_thumbnail/1080 1920w',
    );
    screen.getByText('Add to my calendar');
  });

  it("doesn't add a link to add to my calendar if there is no starting_at date", () => {
    const video = liveMockFactory({
      title: 'live title',
      description: 'live description',
    });

    render(wrapInVideo(<StudentLiveAdvertising />, video));

    expect(
      screen.queryByRole('button', { name: 'Register' }),
    ).not.toBeInTheDocument();

    screen.getByRole('heading', { name: 'live title' });
    screen.getByText('live description');

    screen.getByRole('heading', {
      name: 'Live is starting',
    });
    expect(
      screen.queryByLabelText('Click to add the event to your calendar'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Add to my calendar')).not.toBeInTheDocument();
  });

  it('uses default values for description, duration and title when the video has none for the ics link', () => {
    const video = liveMockFactory({
      starting_at: DateTime.fromJSDate(
        new Date(nextYear, 1, 25, 11, 0, 0),
      ).toISO(),
      description: '',
      is_public: false,
      title: '',
    });

    fetchMock.get(`/api/videos/${video.id}/livesessions/?limit=999`, []);

    render(wrapInVideo(<StudentLiveAdvertising />, video));
    screen.getByText('Add to my calendar');

    // default title
    screen.getByText("title:Don't miss the live!");
    // default description
    screen.getByText('description:Come and join us!');
    // date of the ics link
    screen.getByText(`startTime:${nextYear}-02-25T11:00:00.000+00:00`);
    // one hour has been added for the end
    screen.getByText(`endlive:${nextYear}-02-25T12:00:00.000+00:00`);
    // public is false, there is no URL
    expect(screen.queryByText('url:')).not.toBeInTheDocument();
  });

  it("creates a link when the video is public and uses video's info for the ics link", () => {
    const estimatedDuration = Duration.fromObject({ hours: 6, minutes: 15 });
    const year = new Date().getFullYear() + 1;
    const video = liveMockFactory({
      starting_at: DateTime.fromJSDate(new Date(year, 1, 25, 11, 0, 0)).toISO(),
      estimated_duration: estimatedDuration.toISOTime({
        suppressMilliseconds: true,
      }),
      live_state: liveState.IDLE,
      description: 'this is the description',
      is_public: true,
      title: 'this is the title',
    });
    fetchMock.get(`/api/videos/${video.id}/livesessions/?limit=999`, []);

    render(wrapInVideo(<StudentLiveAdvertising />, video));

    expect(screen.getByText('Add to my calendar')).toBeInTheDocument();

    // default title
    expect(screen.getByText('title:this is the title')).toBeInTheDocument();
    // default description
    expect(
      screen.getByText('description:this is the description'),
    ).toBeInTheDocument();
    // date of the ics link
    expect(
      screen.getByText(`startTime:${year}-02-25T11:00:00.000+00:00`),
    ).toBeInTheDocument();
    // duration has been added to calculate the end
    expect(
      screen.getByText(`endlive:${year}-02-25T17:15:00.000+00:00`),
    ).toBeInTheDocument();
    // url
    expect(
      screen.getByText(`url:https://localhost/videos/${video.id}`),
    ).toBeInTheDocument();
  });
});

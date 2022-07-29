import { cleanup, screen } from '@testing-library/react';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import { DateTime, Duration } from 'luxon';
import React from 'react';

import { useJwt } from 'data/stores/useJwt';
import { liveState } from 'types/tracks';
import { Deferred } from 'utils/tests/Deferred';
import {
  liveSessionFactory,
  thumbnailMockFactory,
  videoMockFactory,
} from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { StudentLiveAdvertising } from '.';

jest.mock('data/stores/useAppConfig', () => ({
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
}));

jest.mock('data/sideEffects/getLiveSessions', () => ({
  getLiveSessions: async () => ({
    count: 0,
    results: [],
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
  beforeEach(() => {
    jest.useFakeTimers();
    //    set system date to 2022-01-27T14:00:00
    jest.setSystemTime(new Date(2022, 1, 27, 14, 0, 0));

    useJwt.setState({
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
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('renders live information when live is not starting and not running and starting_at is null', () => {
    const states = Object.values(liveState).filter(
      (state) =>
        ![liveState.STARTING, liveState.RUNNING, liveState.ENDED].includes(
          state,
        ),
    );

    states.forEach((state) => {
      const video = videoMockFactory({
        live_state: state,
        starting_at: undefined,
        title: 'live title',
        description: 'live description',
      });

      render(wrapInVideo(<StudentLiveAdvertising />, video));

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

    const deferred = new Deferred();
    fetchMock.get('/api/livesessions/?limit=999', deferred.promise);

    render(wrapInVideo(<StudentLiveAdvertising />, video));

    deferred.resolve({
      count: 1,
      next: '',
      previous: '',
      results: [liveSessionFactory({ is_registered: false })],
    });

    await screen.findByRole('button', { name: 'Register' });

    screen.getByRole('heading', { name: 'live title' });
    screen.getByText('live description');

    screen.getByRole('heading', {
      name: 'Live will start in 2 days at 11:00 AM',
    });
    screen.getByText('Add to my calendar');
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
    const video = videoMockFactory({
      starting_at: DateTime.fromJSDate(new Date(2022, 1, 25, 11, 0, 0)).toISO(),
      live_state: liveState.IDLE,
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
    screen.getByText('Add to my calendar');
  });

  it('renders live information with no uploaded thumbnail', () => {
    const video = videoMockFactory({
      starting_at: DateTime.fromJSDate(new Date(2022, 1, 25, 11, 0, 0)).toISO(),
      live_state: liveState.IDLE,
      title: 'live title',
      description: 'live description',
    });

    render(wrapInVideo(<StudentLiveAdvertising />, video));

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

    render(wrapInVideo(<StudentLiveAdvertising />, video));

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toEqual('path/to/image.png');
    screen.getByText('Add to my calendar');
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

  it("doesn't add a link to add to my calendar if there is no starting_at date ", () => {
    const video = videoMockFactory({
      live_state: liveState.IDLE,
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
    const video = videoMockFactory({
      starting_at: DateTime.fromJSDate(new Date(2022, 1, 25, 11, 0, 0)).toISO(),
      live_state: liveState.IDLE,
      description: '',
      is_public: false,
      title: '',
    });
    render(wrapInVideo(<StudentLiveAdvertising />, video));
    screen.getByText('Add to my calendar');

    // default title
    screen.getByText("title:Don't miss the live!");
    // default description
    screen.getByText('description:Come and join us!');
    // date of the ics link
    screen.getByText('startTime:2022-02-25T11:00:00.000+00:00');
    // one hour has been added for the end
    screen.getByText('endlive:2022-02-25T12:00:00.000+00:00');
    // public is false, there is no URL
    expect(screen.queryByText('url:')).not.toBeInTheDocument();
  });

  it("creates a link when the video is public and uses video's info for the ics link", () => {
    const estimatedDuration = Duration.fromObject({ hours: 6, minutes: 15 });
    const year = new Date().getFullYear() + 1;
    const video = videoMockFactory({
      starting_at: DateTime.fromJSDate(new Date(year, 1, 25, 11, 0, 0)).toISO(),
      estimated_duration: estimatedDuration.toISOTime({
        suppressMilliseconds: true,
      }),
      live_state: liveState.IDLE,
      description: 'this is the description',
      is_public: true,
      title: 'this is the title',
    });
    render(wrapInVideo(<StudentLiveAdvertising />, video));

    screen.getByText('Add to my calendar');

    // default title
    screen.getByText('title:this is the title');
    // default description
    screen.getByText('description:this is the description');
    // date of the ics link
    screen.getByText(`startTime:${year}-02-25T11:00:00.000+00:00`);
    // duration has been added to calculate the end
    screen.getByText(`endlive:${year}-02-25T17:15:00.000+00:00`);
    // url
    screen.getByText(`url:https://localhost/videos/${video.id}`);
  });
});

import {
  cleanup,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import React from 'react';
import { QueryClient } from 'react-query';
import { v4 as uuidv4 } from 'uuid';

import { APIList } from 'types/api';
import { Live, LiveSession, liveState } from 'types/tracks';
import { PersistentStore } from 'types/XMPP';
import { Deferred } from 'utils/tests/Deferred';
import { liveSessionFactory, videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';
import { getOrInitAnonymousId } from 'utils/getOrInitAnonymousId';

import { PublicLiveDashboard } from '.';
import { StudentLiveStarter } from './StudentLiveStarter';

const mockedGetDecodedJwt = jest.fn();

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'some_url',
        liveErrorBackground: 'error_img_background.jpg',
      },
    },
  }),
}));

jest.mock('utils/getOrInitAnonymousId', () => ({
  getOrInitAnonymousId: jest.fn(),
}));
const mockGetInitOrAnonymousId = getOrInitAnonymousId as jest.MockedFunction<
  typeof getOrInitAnonymousId
>;

jest.mock('components/ConverseInitializer', () => ({
  ConverseInitializer: ({ children }: { children: React.ReactNode }) => {
    return children;
  },
}));

jest.mock('./StudentLiveStarter', () => ({
  StudentLiveStarter: jest.fn().mockImplementation(() => <p>live starter</p>),
}));
const mockedStudentLiveStarter = StudentLiveStarter as jest.MockedFunction<
  typeof StudentLiveStarter
>;

describe('PublicLiveDashboard', () => {
  beforeEach(() => {
    mockedGetDecodedJwt.mockReturnValue({
      locale: 'en',
      resource_id: 'id',
      permissions: { can_update: false, can_access_dashboard: false },
      roles: [],
      session_id: 'session-id',
    });

    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: mockedGetDecodedJwt,
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.reset();
  });

  it('inits websocket context', async () => {
    const values = Object.values(liveState);

    for (const state of values) {
      if (state === liveState.ENDED) {
        //  running live state ignores liveState.ENDED
        //  but typescript fail to detect type with a filter
        return;
      }

      const video = videoMockFactory();
      const live: Live = { ...video, live_state: state };

      const deferred = new Deferred<APIList<LiveSession>>();
      fetchMock.get('/api/livesessions/?limit=999', deferred.promise);

      mockGetInitOrAnonymousId.mockReturnValue(undefined);

      const queryClient = new QueryClient();

      render(
        wrapInVideo(<PublicLiveDashboard playerType={'videojs'} />, live),
        {
          queryOptions: {
            client: queryClient,
          },
        },
      );

      const loader = screen.getByRole('status');

      deferred.resolve({
        count: 1,
        next: '',
        previous: '',
        results: [liveSessionFactory()],
      });
      await waitForElementToBeRemoved(loader);

      expect(fetchMock.called('/api/livesessions/?limit=999')).toEqual(true);

      fetchMock.reset();
      cleanup();
    }
  });

  it('inits websocket context with an anonymous id', async () => {
    const values = Object.values(liveState);

    for (const state of values) {
      if (state === liveState.ENDED) {
        //  running live state ignores liveState.ENDED
        //  but typescript fail to detect type with a filter
        return;
      }
      const anonymousId = uuidv4();

      const video = videoMockFactory();
      const live: Live = { ...video, live_state: state };

      const deferred = new Deferred<APIList<LiveSession>>();
      fetchMock.get(
        `/api/livesessions/?limit=999&anonymous_id=${anonymousId}`,
        deferred.promise,
      );

      mockGetInitOrAnonymousId.mockReturnValue(anonymousId);
      const queryClient = new QueryClient();

      render(
        wrapInVideo(<PublicLiveDashboard playerType={'videojs'} />, live),
        {
          queryOptions: {
            client: queryClient,
          },
        },
      );

      const loader = screen.getByRole('status');

      deferred.resolve({
        count: 1,
        next: '',
        previous: '',
        results: [liveSessionFactory()],
      });
      await waitForElementToBeRemoved(loader);

      expect(
        fetchMock.called(
          `/api/livesessions/?limit=999&anonymous_id=${anonymousId}`,
        ),
      ).toEqual(true);

      fetchMock.reset();
      cleanup();
    }
  });

  it('pushes an attendance when livesession does not exists during webinar init.', async () => {
    const values = Object.values(liveState);

    for (const state of values) {
      if (state === liveState.ENDED) {
        //  running live state ignores liveState.ENDED
        //  but typescript fail to detect type with a filter
        return;
      }

      const video = videoMockFactory();
      const live: Live = { ...video, live_state: state };

      const deferred = new Deferred<APIList<LiveSession>>();
      fetchMock.get('/api/livesessions/?limit=999', deferred.promise);

      fetchMock.post(
        '/api/livesessions/push_attendance/',
        liveSessionFactory(),
      );

      mockGetInitOrAnonymousId.mockReturnValue(undefined);

      const queryClient = new QueryClient();

      render(
        wrapInVideo(<PublicLiveDashboard playerType={'videojs'} />, live),
        {
          queryOptions: {
            client: queryClient,
          },
        },
      );

      const loader = screen.getByRole('status');

      deferred.resolve({
        count: 0,
        next: '',
        previous: '',
        results: [],
      });
      await waitForElementToBeRemoved(loader);

      expect(fetchMock.called('/api/livesessions/?limit=999')).toEqual(true);
      expect(fetchMock.called('/api/livesessions/push_attendance/')).toEqual(
        true,
      );

      fetchMock.reset();
      cleanup();
    }
  });

  it('pushes an attendance when livesession does not exists during webinar init with an anonymous id.', async () => {
    const values = Object.values(liveState);

    for (const state of values) {
      if (state === liveState.ENDED) {
        //  running live state ignores liveState.ENDED
        //  but typescript fail to detect type with a filter
        return;
      }

      const video = videoMockFactory();
      const live: Live = { ...video, live_state: state };

      const anonymousId = uuidv4();

      const deferred = new Deferred<APIList<LiveSession>>();
      fetchMock.get(
        `/api/livesessions/?limit=999&anonymous_id=${anonymousId}`,
        deferred.promise,
      );

      fetchMock.post(
        `/api/livesessions/push_attendance/?anonymous_id=${anonymousId}`,
        liveSessionFactory(),
      );

      mockGetInitOrAnonymousId.mockReturnValue(anonymousId);

      const queryClient = new QueryClient();

      render(
        wrapInVideo(<PublicLiveDashboard playerType={'videojs'} />, live),
        {
          queryOptions: {
            client: queryClient,
          },
        },
      );

      const loader = screen.getByRole('status');

      deferred.resolve({
        count: 0,
        next: '',
        previous: '',
        results: [],
      });
      await waitForElementToBeRemoved(loader);

      expect(
        fetchMock.called(
          `/api/livesessions/?limit=999&anonymous_id=${anonymousId}`,
        ),
      ).toEqual(true);
      expect(
        fetchMock.called(
          `/api/livesessions/push_attendance/?anonymous_id=${anonymousId}`,
        ),
      ).toEqual(true);

      fetchMock.reset();
      cleanup();
    }
  });

  it('displays advertising when live has no xmpp', async () => {
    const values: (liveState.IDLE | liveState.STARTING)[] = [
      liveState.IDLE,
      liveState.STARTING,
    ];

    for (const state of values) {
      const video = videoMockFactory();
      const live: Live = {
        ...video,
        live_state: state,
      };

      const deferred = new Deferred<APIList<LiveSession>>();
      fetchMock.get('/api/livesessions/?limit=999', deferred.promise);

      mockGetInitOrAnonymousId.mockReturnValue(undefined);

      const queryClient = new QueryClient();

      render(
        wrapInVideo(<PublicLiveDashboard playerType={'videojs'} />, live),
        {
          queryOptions: {
            client: queryClient,
          },
        },
      );

      deferred.resolve({
        count: 1,
        next: '',
        previous: '',
        results: [liveSessionFactory()],
      });

      await screen.findByText(/Live is starting/);

      fetchMock.reset();
      cleanup();
    }
  });

  it('displays the player when live has xmpp', async () => {
    const values: (liveState.IDLE | liveState.STARTING)[] = [
      liveState.IDLE,
      liveState.STARTING,
    ];

    for (const state of values) {
      const video = videoMockFactory();
      const live: Live = {
        ...video,
        live_state: state,
        xmpp: {
          bosh_url: 'https://xmpp-server.com/http-bind',
          converse_persistent_store: PersistentStore.LOCALSTORAGE,
          websocket_url: null,
          conference_url:
            '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
          prebind_url: 'https://xmpp-server.com/http-pre-bind',
          jid: 'xmpp-server.com',
        },
      };
      const deferred = new Deferred<APIList<LiveSession>>();
      fetchMock.get('/api/livesessions/?limit=999', deferred.promise);

      mockGetInitOrAnonymousId.mockReturnValue(undefined);

      const queryClient = new QueryClient();

      render(
        wrapInVideo(<PublicLiveDashboard playerType={'someplayer'} />, live),
        {
          queryOptions: {
            client: queryClient,
          },
        },
      );

      deferred.resolve({
        count: 1,
        next: '',
        previous: '',
        results: [liveSessionFactory()],
      });

      await screen.findByText('live starter');
      expect(mockedStudentLiveStarter).toHaveBeenCalledWith(
        {
          playerType: 'someplayer',
        },
        {},
      );

      fetchMock.reset();
      cleanup();
    }
  });

  it('displays the error message when fetching livesession fails', async () => {
    const video = videoMockFactory();
    const live: Live = { ...video, live_state: liveState.IDLE };

    const deferred = new Deferred();
    fetchMock.get('/api/livesessions/?limit=999', deferred.promise);

    mockGetInitOrAnonymousId.mockReturnValue(undefined);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(wrapInVideo(<PublicLiveDashboard playerType={'videojs'} />, live), {
      queryOptions: {
        client: queryClient,
      },
    });

    const loader = screen.getByRole('status');

    deferred.resolve(400);
    await waitForElementToBeRemoved(loader);

    expect(fetchMock.called('/api/livesessions/?limit=999')).toEqual(true);
    screen.getByText('Impossible to configure the webinar');
  });
});

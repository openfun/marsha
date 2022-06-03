import {
  cleanup,
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import React from 'react';

import { getDecodedJwt } from 'data/appData';
import { Live, liveState } from 'types/tracks';
import { PersistentStore } from 'types/XMPP';
import { initWebinarContext } from 'utils/initWebinarContext';
import { Deferred } from 'utils/tests/Deferred';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { PublicLiveDashboard } from '.';
import { StudentLiveStarter } from './StudentLiveStarter';

jest.mock('data/appData', () => ({
  appData: {
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  },
  getDecodedJwt: jest.fn(),
}));
const mockedGetDecodedJwt = getDecodedJwt as jest.MockedFunction<
  typeof getDecodedJwt
>;

jest.mock('utils/initWebinarContext', () => ({
  initWebinarContext: jest.fn(),
}));
const mockedInitWebinarContext = initWebinarContext as jest.MockedFunction<
  typeof initWebinarContext
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
      maintenance: false,
      resource_id: 'id',
      permissions: { can_update: false, can_access_dashboard: false },
      roles: [],
      session_id: 'session-id',
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
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

      const deferred = new Deferred<void>();
      mockedInitWebinarContext.mockReturnValue(deferred.promise);

      render(
        wrapInIntlProvider(
          <PublicLiveDashboard live={live} playerType={'videojs'} />,
        ),
      );

      const loader = screen.getByRole('status');

      deferred.resolve();
      await waitForElementToBeRemoved(loader);

      expect(mockedInitWebinarContext).toHaveBeenCalledWith(live, 'en');

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

      render(
        wrapInIntlProvider(
          <PublicLiveDashboard live={live} playerType="someplayer" />,
        ),
      );

      await screen.findByText(/Live is starting/);

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

      render(
        wrapInIntlProvider(
          <PublicLiveDashboard live={live} playerType="someplayer" />,
        ),
      );

      await screen.findByText('live starter');
      expect(mockedStudentLiveStarter).toHaveBeenCalledWith(
        {
          live,
          playerType: 'someplayer',
        },
        {},
      );

      cleanup();
    }
  });
});

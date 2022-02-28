import React from 'react';
import { act, render } from '@testing-library/react';

import { Chat } from 'components/Chat';
import { getDecodedJwt } from 'data/appData';
import { useLiveRegistration } from 'data/stores/useLiveRegistration';
import { DecodedJwt } from 'types/jwt';
import { liveState } from 'types/tracks';
import { PersistentStore } from 'types/XMPP';
import { converseMounter } from 'utils/conversejs/converse';
import {
  liveRegistrationFactory,
  videoMockFactory,
} from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

const mockVideo = videoMockFactory({
  id: '5cffe85a-1829-4000-a6ca-a45d4647dc0d',
  live_state: liveState.RUNNING,
  xmpp: {
    bosh_url: 'https://xmpp-server.com/http-bind',
    converse_persistent_store: PersistentStore.LOCALSTORAGE,
    websocket_url: null,
    conference_url:
      '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
    prebind_url: 'https://xmpp-server.com/http-pre-bind',
    jid: 'xmpp-server.com',
  },
});
jest.mock('data/appData', () => ({
  appData: {
    video: mockVideo,
  },
  getDecodedJwt: jest.fn(),
}));

jest.mock('utils/conversejs/converse', () => ({
  converseMounter: jest.fn(() => jest.fn()),
}));

const mockConverseMounter = converseMounter as jest.MockedFunction<
  typeof converseMounter
>;

const mockGetDecodedJwt = getDecodedJwt as jest.MockedFunction<
  typeof getDecodedJwt
>;

describe('<Chat />', () => {
  afterEach(() => {
    mockGetDecodedJwt.mockReset();
  });
  it('does not initialize converse without liveRegistration if user can not access dashboard', async () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
    } as DecodedJwt);
    const liveRegistration = liveRegistrationFactory();
    render(wrapInIntlProvider(<Chat video={mockVideo} />));
    // mockConverseMounter returns itself a mock. We want to inspect this mock to be sure that
    // is was called with the container name and the xmpp object
    expect(mockConverseMounter.mock.results[0].value).not.toHaveBeenCalled();

    act(() => {
      useLiveRegistration.getState().setLiveRegistration(liveRegistration);
    });
    expect(mockConverseMounter.mock.results[0].value).toHaveBeenCalledWith(
      mockVideo.xmpp,
      null,
    );
  });
  it('initializes converse with the displayname', () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
    } as DecodedJwt);
    mockConverseMounter.mock.results[0].value.mockReset();
    const liveRegistration = liveRegistrationFactory({ display_name: 'john' });
    render(wrapInIntlProvider(<Chat video={mockVideo} />));
    // mockConverseMounter returns itself a mock. We want to inspect this mock to be sure that
    // is was called with the container name and the xmpp object
    expect(mockConverseMounter.mock.results[0].value).not.toHaveBeenCalled();

    act(() => {
      useLiveRegistration.getState().setLiveRegistration(liveRegistration);
    });
    expect(mockConverseMounter.mock.results[0].value).toHaveBeenCalledWith(
      mockVideo.xmpp,
      'john',
    );
  });

  it('initializes converse wihtout wiating live registration when you can access dashboard', () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_access_dashboard: true,
        can_update: false,
      },
    } as DecodedJwt);
    mockConverseMounter.mock.results[0].value.mockReset();
    render(wrapInIntlProvider(<Chat video={mockVideo} />));
    // mockConverseMounter returns itself a mock. We want to inspect this mock to be sure that
    // is was called with the container name and the xmpp object
    expect(mockConverseMounter.mock.results[0].value).toHaveBeenCalledWith(
      mockVideo.xmpp,
    );
  });
});

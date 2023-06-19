import { screen } from '@testing-library/react';
import { Maybe } from 'lib-common';
import {
  AppConfigProvider,
  appNames,
  appState,
  modelName,
  useCurrentSession,
  useCurrentUser,
  useJwt,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';
import { IntlShape, useIntl } from 'react-intl';

import AppContentLoader from '.';

let intl: Maybe<IntlShape>;
const MockContent = () => {
  intl = useIntl();

  return <span>content</span>;
};
jest.mock('apps/classroom/components/Routes', () => MockContent);

describe('<AppContentLoader />', () => {
  beforeEach(() => {
    useCurrentUser.setState({ currentUser: undefined });
    useCurrentSession.setState({ sessionId: undefined });
    intl = undefined;

    jest.resetAllMocks();
  });

  it('initialize current user before loading content', async () => {
    useJwt.setState({
      jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uX2lkIjoic29tZV9zZXNzaW9uX2lkIiwidXNlciI6eyJhbm9ueW1vdXNfaWQiOiJhbm9ueW1vdXMgaWQiLCJlbWFpbCI6InNvbWUgZW1haWwiLCJpZCI6ImlkIiwidXNlcm5hbWUiOiJ1c2VyIG5hbWUiLCJ1c2VyX2Z1bGxuYW1lIjoidXNlciBmdWxsIG5hbWUifSwibG9jYWxlIjoicGwiLCJtYWludGVuYW5jZSI6ZmFsc2UsInBlcm1pc3Npb25zIjp7ImNhbl9hY2Nlc3NfZGFzaGJvYXJkIjpmYWxzZSwiY2FuX3VwZGF0ZSI6ZmFsc2V9LCJyZXNvdXJjZV9pZCI6InJlc291cmNlIGlkIiwicm9sZXMiOltdfQ.gv0kmitQfOv93TQuFTHsiqQJFWeTkbmb1h8J8uMVX70',
    });

    render(
      <AppConfigProvider
        value={{
          appName: appNames.CLASSROOM,
          attendanceDelay: 10,
          state: appState.SUCCESS,
          modelName: modelName.VIDEOS,
          sentry_dsn: 'test.dns.com',
          environment: 'tests',
          frontend: 'test-frontend',
          release: 'debug',
          static: {
            svg: {
              icons: '',
            },
            img: {
              liveBackground: '',
              liveErrorBackground: '',
              marshaWhiteLogo: '',
              videoWizardBackground: '',
              errorMain: '',
            },
          },
          uploadPollInterval: 10,
          p2p: {
            live_enabled: false,
            live_stun_server_urls: [],
            live_web_torrent_tracker_urls: [],
          }
        }}
      >
        <AppContentLoader />
      </AppConfigProvider>,
    );

    await screen.findByText('content');

    expect(useCurrentSession.getState()).toEqual({
      sessionId: 'some_session_id',
    });
    expect(useCurrentUser.getState().currentUser).toEqual({
      anonymous_id: 'anonymous id',
      email: 'some email',
      id: 'id',
      username: 'user name',
      full_name: 'user full name',
      is_staff: false,
      is_superuser: false,
      organization_accesses: [],
    });

    expect(intl?.locale).toEqual('pl');
  });

  it('renders an error page if no jwt provided', async () => {
    render(
      <AppConfigProvider
        value={{
          appName: appNames.CLASSROOM,
          attendanceDelay: 10,
          state: appState.SUCCESS,
          modelName: modelName.VIDEOS,
          sentry_dsn: 'test.dns.com',
          environment: 'tests',
          frontend: 'test-frontend',
          release: 'debug',
          static: {
            svg: {
              icons: '',
            },
            img: {
              liveBackground: '',
              liveErrorBackground: '',
              marshaWhiteLogo: '',
              videoWizardBackground: '',
              errorMain: '',
            },
          },
          uploadPollInterval: 10,
          p2p_live_enabled: false,
          p2p_live_stun_server_urls: [],
          p2p_live_web_torrent_tracker_urls: [],
        }}
      >
        <AppContentLoader />
      </AppConfigProvider>,
    );

    screen.queryByText(
      'Unable to find a jwt Token. The ressource might not exist.',
    );
  });
});

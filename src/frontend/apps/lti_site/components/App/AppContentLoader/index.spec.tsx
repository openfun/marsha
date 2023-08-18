import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Maybe } from 'lib-common';
import {
  AppConfigProvider,
  appNames,
  appState,
  modelName,
  playlistMockFactory,
  useCurrentSession,
  useCurrentUser,
  useJwt,
  videoMockFactory,
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

  afterEach(() => {
    fetchMock.restore();
  });

  it('initialize current user before loading content', async () => {
    useJwt.setState({
      jwt: 'ewogICJhbGciOiAiSFMyNTYiLAogICJ0eXAiOiAiSldUIgp9.ewogICJzZXNzaW9uX2lkIjogInNvbWVfc2Vzc2lvbl9pZCIsCiAgInVzZXIiOiB7CiAgICAiYW5vbnltb3VzX2lkIjogImFub255bW91cyBpZCIsCiAgICAiZW1haWwiOiAic29tZSBlbWFpbCIsCiAgICAiaWQiOiAiaWQiLAogICAgInVzZXJuYW1lIjogInVzZXIgbmFtZSIsCiAgICAidXNlcl9mdWxsbmFtZSI6ICJ1c2VyIGZ1bGwgbmFtZSIKICB9LAogICJsb2NhbGUiOiAicGwiLAogICJtYWludGVuYW5jZSI6IGZhbHNlLAogICJwZXJtaXNzaW9ucyI6IHsKICAgICJjYW5fYWNjZXNzX2Rhc2hib2FyZCI6IGZhbHNlLAogICAgImNhbl91cGRhdGUiOiBmYWxzZQogIH0sCiAgInBsYXlsaXN0X2lkIjogInBsYXlsaXN0IGlkIiwKICAicm9sZXMiOiBbXQp9.gv0kmitQfOv93TQuFTHsiqQJFWeTkbmb1h8J8uMVX70',
    });

    const playlist = playlistMockFactory({ id: '488db2d0' });
    const video = videoMockFactory({ playlist });

    fetchMock.get('/api/playlists/488db2d0/is-claimed/', {
      status: 200,
      body: {
        is_claimed: false,
      },
    });

    render(
      <AppConfigProvider
        value={{
          appName: appNames.CLASSROOM,
          attendanceDelay: 10,
          state: appState.SUCCESS,
          modelName: modelName.VIDEOS,
          resource: video,
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
            isEnabled: false,
            stunServerUrls: [],
            webTorrentTrackerUrls: [],
          },
        }}
      >
        <AppContentLoader />
      </AppConfigProvider>,
    );

    await waitFor(() => {
      expect(fetchMock.calls()).toHaveLength(1);
    });
    await screen.findByText('content');
    expect(
      screen.queryByText(
        'Please login to manage this resource on marsha.education.',
      ),
    ).not.toBeInTheDocument();

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
    const mockConsoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

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
            isEnabled: false,
            stunServerUrls: [],
            webTorrentTrackerUrls: [],
          },
        }}
      >
        <AppContentLoader />
      </AppConfigProvider>,
    );

    expect(
      await screen.findByText(
        'Unable to find a jwt Token. The ressource might not exist.',
      ),
    ).toBeInTheDocument();

    expect(mockConsoleError).toHaveBeenCalled();
  });
});

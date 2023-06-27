import fetchMock from 'fetch-mock';
import { screen } from '@testing-library/react';
import {
  AppConfigProvider,
  appNames,
  appState,
  DecodedJwtLTI,
  modelName,
  playlistMockFactory,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { ClaimLink } from '.';

describe('<ClaimLink />', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it('shows claim link', async () => {
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
          frontend_home_url: 'http://localhost:8000/',
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
            webTorrentTrackerUrls: [],
            stunServerUrls: [],
          },
        }}
      >
        <ClaimLink
          decodedJwt={
            {
              playlist_id: '488db2d0',
              resource_id: 'e8c0b8d0',
              consumer_site: '32a1c2d0',
              user: { id: '6b45a4d6' },
            } as DecodedJwtLTI
          }
        />
      </AppConfigProvider>,
    );

    expect(fetchMock.calls()).toHaveLength(1);

    const link = await screen.findByText(
      'Please login to manage this resource on http://localhost:8000/',
    );
    expect(link.getAttribute('href')).toEqual(
      'http://localhost:8000//claim-resource?lti_consumer_site_id=32a1c2d0&resource_id=e8c0b8d0&modelName=videos&playlist_id=488db2d0&lti_user_id=6b45a4d6',
    );
    expect(link.getAttribute('target')).toEqual('_blank');
    expect(link.getAttribute('rel')).toEqual('noopener noreferrer');
  });

  it('does not show claim link if resource is claimed', async () => {
    const playlist = playlistMockFactory({ id: '488db2d0' });
    const video = videoMockFactory({ playlist });

    fetchMock.get('/api/playlists/488db2d0/is-claimed/', {
      status: 200,
      body: {
        is_claimed: true,
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
          frontend_home_url: 'http://localhost:8000/',
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
            webTorrentTrackerUrls: [],
            stunServerUrls: [],
          },
        }}
      >
        <ClaimLink
          decodedJwt={
            {
              playlist_id: '488db2d0',
              resource_id: 'e8c0b8d0',
              consumer_site: '32a1c2d0',
              user: { id: '6b45a4d6' },
            } as DecodedJwtLTI
          }
        />
      </AppConfigProvider>,
    );

    expect(fetchMock.calls()).toHaveLength(1);
    expect(
      screen.queryByText(
        'Please login to manage this resource on marsha.education.',
      ),
    ).not.toBeInTheDocument();
  });

  it('does not show claim link if resource is undefined', async () => {
    const playlist = playlistMockFactory({ id: '488db2d0' });

    fetchMock.get('/api/playlists/488db2d0/is-claimed/', {
      status: 200,
      body: {
        is_claimed: true,
      },
    });

    render(
      <AppConfigProvider
        value={{
          appName: appNames.CLASSROOM,
          attendanceDelay: 10,
          state: appState.SUCCESS,
          modelName: modelName.VIDEOS,
          resource: undefined,
          sentry_dsn: 'test.dns.com',
          environment: 'tests',
          frontend: 'test-frontend',
          frontend_home_url: 'http://localhost:8000/',
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
            webTorrentTrackerUrls: [],
            stunServerUrls: [],
          },
        }}
      >
        <ClaimLink
          decodedJwt={
            {
              playlist_id: '488db2d0',
              resource_id: 'e8c0b8d0',
              consumer_site: '32a1c2d0',
              user: { id: '6b45a4d6' },
            } as DecodedJwtLTI
          }
        />
      </AppConfigProvider>,
    );

    expect(fetchMock.calls()).toHaveLength(0);
    expect(
      screen.queryByText(
        'Please login to manage this resource on marsha.education.',
      ),
    ).not.toBeInTheDocument();
  });
});

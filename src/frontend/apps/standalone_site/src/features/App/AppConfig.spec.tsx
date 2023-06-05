import { waitFor, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useSentry } from 'lib-components';
import { Deferred, render } from 'lib-tests';

import { useContentFeatures } from 'features/Contents';

import AppConfig from './AppConfig';

useSentry.setState({
  setSentry: () => useSentry.setState({ isSentryReady: true }),
});

describe('AppConfig', () => {
  beforeEach(() => {
    useSentry.setState({
      isSentryReady: false,
    });
    useContentFeatures.setState({
      featureRouter: [],
      featureRoutes: {},
      featureSamples: () => [],
      featureShuffles: [],
      isFeatureLoaded: false,
    });
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('should init Sentry when active', async () => {
    fetchMock.get('/api/config/?domain=localhost', {
      environment: 'some environment',
      release: 'some release',
      sentry_dsn: 'some dsn',
      inactive_content_types: [],
    });

    expect(useSentry.getState().isSentryReady).toEqual(false);

    render(<AppConfig />);

    expect(fetchMock.called('/api/config/')).toBe(true);
    await waitFor(() => {
      expect(useSentry.getState().isSentryReady).toEqual(true);
    });
  });

  it('should not init Sentry when not active', async () => {
    fetchMock.get(
      '/api/config/?domain=localhost',
      {
        environment: 'some environment',
        release: 'some release',
        sentry_dsn: null,
        inactive_content_types: [],
      },
      { overwriteRoutes: true },
    );
    expect(useSentry.getState().isSentryReady).toEqual(false);

    render(<AppConfig />);

    expect(fetchMock.called('/api/config/')).toBe(true);
    await waitFor(() => {
      expect(useSentry.getState().isSentryReady).toEqual(false);
    });
  });

  it('should have features active', async () => {
    const deferred = new Deferred();

    fetchMock.get('/api/config/?domain=localhost', deferred.promise);

    expect(useSentry.getState().isSentryReady).toEqual(false);

    render(<AppConfig>My app</AppConfig>);

    expect(
      screen.getByRole('alert', {
        name: /spinner/i,
      }),
    ).toBeInTheDocument();

    deferred.resolve({
      environment: 'some environment',
      release: 'some release',
      sentry_dsn: 'some dsn',
      inactive_content_types: [],
    });

    expect(await screen.findByText('My app')).toBeInTheDocument();

    expect(fetchMock.called('/api/config/')).toBe(true);

    expect(useContentFeatures.getState().featureRouter).toEqual(
      expect.arrayContaining([
        expect.anything(),
        expect.anything(),
        expect.anything(),
      ]),
    );
    expect(useContentFeatures.getState().featureRoutes).toEqual({
      VIDEO: expect.any(Object),
      LIVE: expect.any(Object),
      CLASSROOM: expect.any(Object),
    });
    expect(useContentFeatures.getState().featureSamples()).toEqual([
      expect.any(Object),
      expect.any(Object),
      expect.any(Object),
    ]);
    expect(useContentFeatures.getState().featureShuffles).toEqual([
      expect.anything(),
    ]);
  });

  it('should inactive features', async () => {
    fetchMock.get('/api/config/', {
      environment: 'some environment',
      release: 'some release',
      sentry_dsn: 'some dsn',
      inactive_resources: ['classroom', 'webinar', 'video'],
    });

    expect(useSentry.getState().isSentryReady).toEqual(false);

    render(<AppConfig>My app</AppConfig>);

    expect(await screen.findByText('My app')).toBeInTheDocument();
    expect(fetchMock.called('/api/config/')).toBe(true);
    expect(useContentFeatures.getState().featureRouter).toEqual([]);
    expect(useContentFeatures.getState().featureRoutes).toEqual({});
    expect(useContentFeatures.getState().featureSamples()).toEqual([]);
    expect(useContentFeatures.getState().featureShuffles).toEqual([]);
  });
});

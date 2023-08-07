import { act, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useP2PConfig, useSentry, useSiteConfig } from 'lib-components';
import { Deferred, render } from 'lib-tests';
import { defineMessages, useIntl } from 'react-intl';

import { ConfigResponse } from 'api/useConfig';
import { useContentFeatures } from 'features/Contents';
import { useLanguageStore } from 'features/Language/store/languageStore';

import AppConfig from './AppConfig';

const consoleWarn = jest
  .spyOn(console, 'warn')
  .mockImplementation(() => jest.fn());

window.isCDNLoaded = true;

useSentry.setState({
  setSentry: () => useSentry.setState({ isSentryReady: true }),
});

let deferredConfig: Deferred<unknown>;
const config: ConfigResponse = {
  environment: 'some environment',
  release: 'some release',
  sentry_dsn: 'some dsn',
  inactive_resources: [],
  vod_conversion_enabled: true,
  p2p: {
    isEnabled: false,
    stunServerUrls: [],
    webTorrentTrackerUrls: [],
  },
  is_default_site: true,
};

describe('AppConfig', () => {
  beforeEach(() => {
    useSentry.setState({
      isSentryReady: false,
    });
    useP2PConfig.setState({
      isP2PEnabled: false,
      stunServersUrls: [],
      webTorrentServerTrackerUrls: [],
    });
    useContentFeatures.setState({
      featureRouter: [],
      featureRoutes: {},
      featureSamples: () => [],
      featureShuffles: [],
      isFeatureLoaded: false,
    });

    deferredConfig = new Deferred();
    fetchMock.get('/api/config/', deferredConfig.promise);
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
    consoleWarn.mockClear();
  });

  it('should init Sentry when active', async () => {
    deferredConfig.resolve(config);

    expect(useSentry.getState().isSentryReady).toEqual(false);

    render(<AppConfig />);

    expect(fetchMock.called('/api/config/')).toBe(true);
    await waitFor(() => {
      expect(useSentry.getState().isSentryReady).toEqual(true);
    });
  });

  it('should init p2p live config', async () => {
    deferredConfig.resolve({
      ...config,
      p2p: {
        isEnabled: true,
        stunServerUrls: ['https://stun.example.com'],
        webTorrentTrackerUrls: ['https://tracker.example.com'],
      },
    });

    expect(useP2PConfig.getState().isP2PEnabled).toEqual(false);
    expect(useP2PConfig.getState().stunServersUrls).toEqual([]);
    expect(useP2PConfig.getState().webTorrentServerTrackerUrls).toEqual([]);

    render(<AppConfig />);

    expect(fetchMock.called('/api/config/')).toBe(true);
    await waitFor(() => {
      expect(useP2PConfig.getState().isP2PEnabled).toEqual(true);
    });

    await waitFor(() => {
      expect(useP2PConfig.getState().stunServersUrls).toEqual([
        'https://stun.example.com',
      ]);
    });

    await waitFor(() => {
      expect(useP2PConfig.getState().webTorrentServerTrackerUrls).toEqual([
        'https://tracker.example.com',
      ]);
    });
  });

  it('should not init Sentry when not active', async () => {
    deferredConfig.resolve({
      ...config,
      sentry_dsn: null,
    });
    expect(useSentry.getState().isSentryReady).toEqual(false);

    render(<AppConfig />);

    expect(fetchMock.called('/api/config/')).toBe(true);
    await waitFor(() => {
      expect(useSentry.getState().isSentryReady).toEqual(false);
    });
  });

  it('should have features active', async () => {
    render(<AppConfig>My app</AppConfig>);

    expect(
      screen.getByRole('alert', {
        name: /spinner/i,
      }),
    ).toBeInTheDocument();

    deferredConfig.resolve(config);

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

  it('should inactive resources', async () => {
    deferredConfig.resolve({
      ...config,
      inactive_resources: ['classroom', 'webinar', 'video'],
    });

    render(<AppConfig>My app</AppConfig>);

    expect(await screen.findByText('My app')).toBeInTheDocument();
    expect(fetchMock.called('/api/config/')).toBe(true);
    expect(useContentFeatures.getState().featureRouter).toEqual([]);
    expect(useContentFeatures.getState().featureRoutes).toEqual({});
    expect(useContentFeatures.getState().featureSamples()).toEqual([]);
    expect(useContentFeatures.getState().featureShuffles).toEqual([]);
  });

  it('should set siteConfig', async () => {
    deferredConfig.resolve({
      ...config,
      is_default_site: false,
      logo_url: 'some logo',
      login_html: 'some login',
      footer_copyright: 'some footer',
      vod_conversion_enabled: false,
    });

    render(<AppConfig />);
    expect(fetchMock.called('/api/config/')).toBe(true);

    await waitFor(() => {
      expect(useSiteConfig.getState().getSiteConfig()).toEqual({
        is_default_site: false,
        logo_url: 'some logo',
        login_html: 'some login',
        footer_copyright: 'some footer',
        vod_conversion_enabled: false,
      });
    });
    expect(useSiteConfig.getState().siteConfig).toEqual({
      is_default_site: false,
      logo_url: 'some logo',
      login_html: 'some login',
      footer_copyright: 'some footer',
      vod_conversion_enabled: false,
    });
  });

  it('should inactive features', async () => {
    deferredConfig.resolve({
      ...config,
      vod_conversion_enabled: false,
    });

    render(<AppConfig>My app</AppConfig>);

    expect(await screen.findByText('My app')).toBeInTheDocument();
    expect(fetchMock.called('/api/config/')).toBe(true);
    expect(
      useSiteConfig.getState().getSiteConfig().vod_conversion_enabled,
    ).toEqual(false);
  });

  it('should translate to another language', async () => {
    const messages = defineMessages({
      testMessage: {
        defaultMessage: 'My test',
        id: 'test',
      },
    });

    const TestComponent = () => {
      const intl = useIntl();

      return <div>{intl.formatMessage(messages.testMessage)}</div>;
    };

    jest.mock(
      'translations/fr_FR.json',
      () => ({
        test: 'Mon test',
      }),
      { virtual: true },
    );

    deferredConfig.resolve(config);

    render(
      <AppConfig>
        <TestComponent />
      </AppConfig>,
    );

    expect(await screen.findByText(/My test/i)).toBeInTheDocument();

    useLanguageStore.getState().setLanguage('fr');
    expect(await screen.findByText(/Mon test/i)).toBeInTheDocument();
  });

  it('should load when the CDN is ready', async () => {
    window.isCDNLoaded = false;

    deferredConfig.resolve(config);
    render(<AppConfig>My app</AppConfig>);

    expect(
      screen.getByRole('alert', {
        name: /spinner/i,
      }),
    ).toBeInTheDocument();

    window.isCDNLoaded = true;
    act(() => {
      document.dispatchEvent(new Event('CDNLoaded'));
    });

    expect(await screen.findByText('My app')).toBeInTheDocument();
  });
});

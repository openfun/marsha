import {
  BoxLoader,
  useFlags,
  useP2PConfig,
  useSentry,
  useSiteConfig,
} from 'lib-components';
import { PropsWithChildren, useEffect } from 'react';
import { RawIntlProvider, defineMessages } from 'react-intl';

import { useConfig } from 'api/useConfig';
import { featureContentLoader, useContentFeatures } from 'features/Contents';
import { useLanguage } from 'features/Language';

const messages = defineMessages({
  metaTitle: {
    defaultMessage: 'Marsha',
    description: 'Meta title website',
    id: 'routes.AppRoutes.metaTitle',
  },
  metaDescription: {
    defaultMessage: 'Marsha',
    description: 'Meta description website',
    id: 'routes.AppRoutes.metaDescription',
  },
});

const AppConfig = ({ children }: PropsWithChildren<unknown>) => {
  const intl = useLanguage();
  const setSentry = useSentry((state) => state.setSentry);
  const setP2PConfig = useP2PConfig((state) => state.setP2PConfig);
  const setSiteConfig = useSiteConfig((state) => state.setSiteConfig);
  const setFlags = useFlags((state) => state.setFlags);
  const { data: config } = useConfig({
    keepPreviousData: true,
    staleTime: Infinity,
  });
  const isFeatureLoaded = useContentFeatures((state) => state.isFeatureLoaded);
  const isConfigReady = isFeatureLoaded && intl;

  useEffect(() => {
    if (!config) {
      return;
    }

    if (config.sentry_dsn) {
      setSentry(
        config.sentry_dsn,
        config.environment,
        config.release,
        'standalone',
      );
    }

    setP2PConfig(
      config.p2p.isEnabled,
      config.p2p.stunServerUrls,
      config.p2p.webTorrentTrackerUrls,
    );

    featureContentLoader(config.inactive_resources);
    setSiteConfig({
      is_default_site: config.is_default_site,
      logo_url: config.logo_url,
      is_logo_enabled: config.is_logo_enabled,
      login_html: config.login_html,
      footer_copyright: config.footer_copyright,
      vod_conversion_enabled: config.vod_conversion_enabled,
      homepage_banner_title: config.homepage_banner_title,
      homepage_banner_text: config.homepage_banner_text,
      meta_description: config.meta_description,
      meta_title: config.meta_title,
    });
    setFlags(config.flags);
  }, [setSentry, setP2PConfig, config, setSiteConfig, setFlags]);

  useEffect(() => {
    if (!intl) {
      return;
    }

    document.title =
      config?.meta_title || intl.formatMessage(messages.metaTitle);

    document
      .querySelector("[name='description']")
      ?.setAttribute(
        'content',
        config?.meta_description ||
          intl.formatMessage(messages.metaDescription),
      );
  }, [intl, config?.meta_title, config?.meta_description]);

  if (!isConfigReady) {
    return <BoxLoader boxProps={{ height: '100vh' }} />;
  }

  return <RawIntlProvider value={intl}>{children}</RawIntlProvider>;
};

export default AppConfig;

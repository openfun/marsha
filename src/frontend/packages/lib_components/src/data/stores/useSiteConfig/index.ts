import { Maybe } from 'lib-common';
import { create } from 'zustand';

interface SiteConfig {
  is_default_site: boolean;
  logo_url: Maybe<string>;
  is_logo_enabled: Maybe<boolean>;
  login_html: Maybe<string>;
  footer_copyright: Maybe<string>;
  vod_conversion_enabled: boolean;
  homepage_banner_title: Maybe<string>;
  homepage_banner_text: Maybe<string>;
}

interface SiteConfigStore {
  siteConfig: SiteConfig;
  setSiteConfig: (siteConfig: SiteConfig) => void;
  getSiteConfig: () => SiteConfig;
}

export const useSiteConfig = create<SiteConfigStore>((set, get) => ({
  siteConfig: {
    is_default_site: true,
    logo_url: undefined,
    is_logo_enabled: undefined,
    login_html: undefined,
    footer_copyright: undefined,
    vod_conversion_enabled: true,
    homepage_banner_text: undefined,
    homepage_banner_title: undefined,
  },
  setSiteConfig: (siteConfig) => {
    set((state) => {
      state.siteConfig = siteConfig;
      return state;
    });
  },
  getSiteConfig: () => {
    return get().siteConfig;
  },
}));

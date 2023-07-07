import { Maybe } from 'lib-common';
import { create } from 'zustand';

interface SiteConfig {
  is_default_site: boolean;
  logo_url: Maybe<string>;
  login_html: Maybe<string>;
  footer_copyright: Maybe<string>;
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
    login_html: undefined,
    footer_copyright: undefined,
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

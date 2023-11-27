import { create } from 'zustand';

export interface SiteConfig {
  is_default_site: boolean;
  logo_url?: string;
  is_logo_enabled?: boolean;
  login_html?: string;
  footer_copyright?: string;
  vod_conversion_enabled: boolean;
  homepage_banner_title?: string;
  homepage_banner_text?: string;
  meta_description?: string;
  meta_title?: string;
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
    meta_description: undefined,
    meta_title: undefined,
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

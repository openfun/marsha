import { useSiteConfig } from '.';

describe('useSiteConfig', () => {
  it('checks siteConfig state', () => {
    expect(useSiteConfig.getState().getSiteConfig()).toEqual({
      is_default_site: true,
      logo_url: undefined,
      login_html: undefined,
      footer_copyright: undefined,
      vod_conversion_enabled: true,
    });

    useSiteConfig.getState().setSiteConfig({
      is_default_site: false,
      logo_url: 'logoSvg',
      login_html: 'login_html',
      footer_copyright: 'footer copyright',
      vod_conversion_enabled: false,
      is_logo_enabled: true,
      homepage_banner_title: 'banner title',
      homepage_banner_text: 'banner text',
    });

    expect(useSiteConfig.getState().getSiteConfig()).toEqual({
      is_default_site: false,
      logo_url: 'logoSvg',
      login_html: 'login_html',
      footer_copyright: 'footer copyright',
      vod_conversion_enabled: false,
      is_logo_enabled: true,
      homepage_banner_title: 'banner title',
      homepage_banner_text: 'banner text',
    });
  });
});

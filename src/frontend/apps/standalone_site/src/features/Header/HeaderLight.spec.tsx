import { screen } from '@testing-library/react';
import { useSiteConfig } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { HeaderLight, HeaderLightLink } from './HeaderLight';

describe('<HeaderLight />', () => {
  beforeEach(() => {
    useSiteConfig.setState({
      siteConfig: {
        is_default_site: true,
        footer_copyright: undefined,
        logo_url: undefined,
        is_logo_enabled: true,
        login_html: undefined,
        vod_conversion_enabled: true,
        homepage_banner_title: 'banner title',
        homepage_banner_text: 'banner text',
        meta_description: 'meta description',
        meta_title: 'meta title',
      },
    });
  });

  test('renders HeaderLight', () => {
    render(<HeaderLight />);
    expect(screen.getByRole('menubar')).toBeInTheDocument();
    expect(screen.getByText(/logo_marsha.svg/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', {
        name: /logo_marsha.svg/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Language Picker/i)).toBeInTheDocument();
  });

  test('renders HeaderLight custom site logo', async () => {
    useSiteConfig.setState({
      siteConfig: {
        is_default_site: false,
        footer_copyright: 'custom copyright',
        logo_url: 'https://example.com/logo.svg',
        is_logo_enabled: true,
        login_html: 'custom login markdown',
        vod_conversion_enabled: true,
        homepage_banner_title: 'banner title',
        homepage_banner_text: 'banner text',
        meta_description: 'meta description',
        meta_title: 'meta title',
      },
    });
    render(<HeaderLight />);
    const logo = await screen.findByRole('img', { name: 'Home' });
    expect(logo).toHaveAttribute('src', 'https://example.com/logo.svg');
    expect(logo).toBeInTheDocument();
  });

  test('renders HeaderLight custom site no logo', () => {
    useSiteConfig.setState({
      siteConfig: {
        is_default_site: false,
        footer_copyright: 'custom copyright',
        logo_url: undefined,
        is_logo_enabled: true,
        login_html: 'custom login markdown',
        vod_conversion_enabled: true,
        homepage_banner_title: 'banner title',
        homepage_banner_text: 'banner text',
        meta_description: 'meta description',
        meta_title: 'meta title',
      },
    });
    render(<HeaderLight />);
    expect(screen.getByText(/logo_marsha.svg/i)).toBeInTheDocument();
  });

  test('renders HeaderLightLink', () => {
    render(<HeaderLightLink />);
    expect(screen.getByRole('menubar')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /logo_marsha.svg/i,
      }),
    ).toBeInTheDocument();
  });

  test('renders HeaderLightLink custom site logo', () => {
    useSiteConfig.setState({
      siteConfig: {
        is_default_site: false,
        footer_copyright: 'custom copyright',
        logo_url: 'https://example.com/logo.svg',
        is_logo_enabled: true,
        login_html: 'custom login markdown',
        vod_conversion_enabled: true,
        homepage_banner_title: 'banner title',
        homepage_banner_text: 'banner text',
        meta_description: 'meta description',
        meta_title: 'meta title',
      },
    });
    render(<HeaderLightLink />);
    expect(screen.getByRole('menubar')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /Home/i,
      }),
    ).toBeInTheDocument();
  });

  test('renders HeaderLightLink custom site no logo', () => {
    useSiteConfig.setState({
      siteConfig: {
        is_default_site: false,
        footer_copyright: 'custom copyright',
        logo_url: undefined,
        is_logo_enabled: true,
        login_html: 'custom login markdown',
        vod_conversion_enabled: true,
        homepage_banner_title: 'banner title',
        homepage_banner_text: 'banner text',
        meta_description: 'meta description',
        meta_title: 'meta title',
      },
    });
    render(<HeaderLightLink />);
    expect(screen.getByRole('menubar')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /logo_marsha.svg/i,
      }),
    ).toBeInTheDocument();
  });
});

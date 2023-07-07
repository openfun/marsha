import { screen } from '@testing-library/react';
import { useSiteConfig } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { HeaderLight, HeaderLightLink } from './HeaderLight';

jest.mock('assets/svg/logo_marsha.svg', () => ({
  ReactComponent: () => <div>My LogoIcon</div>,
}));

describe('<HeaderLight />', () => {
  beforeEach(() => {
    useSiteConfig.setState({
      siteConfig: {
        is_default_site: true,
        footer_copyright: undefined,
        logo_url: undefined,
        login_html: undefined,
      },
    });
  });

  test('renders HeaderLight', () => {
    render(<HeaderLight />);
    expect(screen.getByRole('menubar')).toBeInTheDocument();
    expect(screen.getByText(/My LogoIcon/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', {
        name: /My LogoIcon/i,
      }),
    ).not.toBeInTheDocument();
  });

  test('renders HeaderLight custom site logo', async () => {
    useSiteConfig.setState({
      siteConfig: {
        is_default_site: false,
        footer_copyright: 'custom copyright',
        logo_url: 'https://example.com/logo.svg',
        login_html: 'custom login markdown',
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
        login_html: 'custom login markdown',
      },
    });
    render(<HeaderLight />);
    expect(screen.getByText(/My LogoIcon/i)).toBeInTheDocument();
  });

  test('renders HeaderLightLink', () => {
    render(<HeaderLightLink />);
    expect(screen.getByRole('menubar')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /My LogoIcon/i,
      }),
    ).toBeInTheDocument();
  });

  test('renders HeaderLightLink custom site logo', () => {
    useSiteConfig.setState({
      siteConfig: {
        is_default_site: false,
        footer_copyright: 'custom copyright',
        logo_url: 'https://example.com/logo.svg',
        login_html: 'custom login markdown',
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
        login_html: 'custom login markdown',
      },
    });
    render(<HeaderLightLink />);
    expect(screen.getByRole('menubar')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: /My LogoIcon/i,
      }),
    ).toBeInTheDocument();
  });
});

import { act, screen } from '@testing-library/react';
import { useSiteConfig } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';

import HomePage from './HomePage';

jest.mock('features/Contents', () => ({
  useContentRoutes: () => ({
    CONTENTS: {
      path: '/contents',
    },
  }),
  ContentsShuffle: () => <div>My ContentsShuffle</div>,
}));

describe('<HomePage />', () => {
  it('renders HomePage', async () => {
    render(<HomePage />);
    expect(screen.getByText(/My ContentsShuffle/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '› See Everything' }),
    ).toBeInTheDocument();

    const imageRef = screen.getByAltText('Homepage Banner');
    act(() => {
      ReactTestUtils.Simulate.load(imageRef);
    });

    expect(await screen.findByText(/Learn freely/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Online courses to discover, learn, progress and succeed/i,
      ),
    ).toBeInTheDocument();
  });

  it('renders HomePage with custom site config', async () => {
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

    render(<HomePage />);
    expect(screen.getByText(/My ContentsShuffle/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '› See Everything' }),
    ).toBeInTheDocument();

    const imageRef = screen.getByAltText('Homepage Banner');
    act(() => {
      ReactTestUtils.Simulate.load(imageRef);
    });

    expect(await screen.findByText(/banner title/i)).toBeInTheDocument();
    expect(screen.getByText(/banner text/i)).toBeInTheDocument();
  });

  it('renders HomePage with custom site config but empty banner info', async () => {
    useSiteConfig.setState({
      siteConfig: {
        is_default_site: false,
        footer_copyright: 'custom copyright',
        logo_url: 'https://example.com/logo.svg',
        is_logo_enabled: true,
        login_html: 'custom login markdown',
        vod_conversion_enabled: true,
        homepage_banner_title: '',
        homepage_banner_text: '',
        meta_description: '',
        meta_title: '',
      },
    });

    render(<HomePage />);
    expect(screen.getByText(/My ContentsShuffle/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '› See Everything' }),
    ).toBeInTheDocument();

    const imageRef = screen.getByAltText('Homepage Banner');
    act(() => {
      ReactTestUtils.Simulate.load(imageRef);
    });

    expect(await screen.findByText(/Learn freely/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Online courses to discover, learn, progress and succeed/i,
      ),
    ).toBeInTheDocument();
  });
});

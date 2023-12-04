import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCurrentUser, useSiteConfig } from 'lib-components';
import { userMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';

import Header from './Header';

describe('<Header />', () => {
  beforeEach(() => {
    useCurrentUser.setState({
      currentUser: undefined,
    });
  });

  it('renders Header', () => {
    useCurrentUser.setState({
      currentUser: userMockFactory({
        full_name: 'John Doe',
      }),
    });
    render(<Header />);
    expect(screen.getByRole('menubar')).toBeInTheDocument();
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/language/i)).toBeInTheDocument();
    expect(screen.getByText(/Language Picker/i)).toBeInTheDocument();
  });

  it('scrolls and updates background', () => {
    render(<Header />);

    const menuBar = screen.getByRole('menubar');
    expect(menuBar).toBeInTheDocument();
    expect(menuBar).toHaveStyle('background: transparent');
    fireEvent.scroll(window, { target: { scrollY: 100 } });
    expect(menuBar).toHaveStyle('background: #fff');
  });

  it('clicks on Logo routes to Homepage', async () => {
    render(<div>My Homepage</div>, {
      routerOptions: {
        routes: [
          {
            path: '/videos',
            element: <div>My Videos</div>,
          },
        ],
        header: <Header />,
        history: ['/videos'],
      },
    });

    const logo = screen.getByText(/logo_marsha.svg/i);
    expect(logo).toBeInTheDocument();
    expect(screen.getByText(/My Videos/i)).toBeInTheDocument();
    expect(screen.queryByText(/My Homepage/i)).not.toBeInTheDocument();
    await userEvent.click(logo);
    expect(screen.getByText(/My Homepage/i)).toBeInTheDocument();
    expect(screen.queryByText(/My Videos/i)).not.toBeInTheDocument();
  });

  it('clicks on custom Logo routes to Homepage', async () => {
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

    render(<div>My Homepage</div>, {
      routerOptions: {
        routes: [
          {
            path: '/videos',
            element: <div>My Videos</div>,
          },
        ],
        header: <Header />,
        history: ['/videos'],
      },
    });

    const logo = screen.getByRole('img', { name: 'Home' });
    expect(logo).toHaveAttribute('src', 'https://example.com/logo.svg');
    expect(logo).toBeInTheDocument();
    expect(screen.getByText(/My Videos/i)).toBeInTheDocument();
    expect(screen.queryByText(/My Homepage/i)).not.toBeInTheDocument();
    await userEvent.click(logo);
    expect(screen.getByText(/My Homepage/i)).toBeInTheDocument();
    expect(screen.queryByText(/My Videos/i)).not.toBeInTheDocument();
  });

  it('clicks on custom Logo routes to Homepage with default logo', async () => {
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

    render(<div>My Homepage</div>, {
      routerOptions: {
        routes: [
          {
            path: '/videos',
            element: <div>My Videos</div>,
          },
        ],
        header: <Header />,
        history: ['/videos'],
      },
    });

    const logo = screen.getByText(/logo_marsha.svg/i);
    expect(logo).toBeInTheDocument();
    expect(screen.getByText(/My Videos/i)).toBeInTheDocument();
    expect(screen.queryByText(/My Homepage/i)).not.toBeInTheDocument();
    await userEvent.click(logo);
    expect(screen.getByText(/My Homepage/i)).toBeInTheDocument();
    expect(screen.queryByText(/My Videos/i)).not.toBeInTheDocument();
  });

  it("doesn't display the logo when is_logo_enabled is false", () => {
    useSiteConfig.setState({
      siteConfig: {
        is_default_site: false,
        footer_copyright: 'custom copyright',
        logo_url: undefined,
        is_logo_enabled: false,
        login_html: 'custom login markdown',
        vod_conversion_enabled: true,
        homepage_banner_title: 'banner title',
        homepage_banner_text: 'banner text',
        meta_description: 'meta description',
        meta_title: 'meta title',
      },
    });

    render(<div>My Homepage</div>, {
      routerOptions: {
        routes: [
          {
            path: '/videos',
            element: <div>My Videos</div>,
          },
        ],
        header: <Header />,
        history: ['/videos'],
      },
    });

    expect(screen.queryByRole('img', { name: 'Home' })).not.toBeInTheDocument();
  });
});

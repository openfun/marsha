import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCurrentUser, userMockFactory, useSiteConfig } from 'lib-components';
import { render } from 'lib-tests';

import Header from './Header';

describe('<Header />', () => {
  beforeEach(() => {
    useCurrentUser.setState({
      currentUser: undefined,
    });
  });

  test('renders Header', () => {
    useCurrentUser.setState({
      currentUser: userMockFactory({
        full_name: 'John Doe',
      }),
    });
    render(<Header />);
    expect(screen.getByRole('menubar')).toBeInTheDocument();
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  });

  test('scroll and update background', () => {
    render(<Header />);

    const menuBar = screen.getByRole('menubar');
    expect(menuBar).toBeInTheDocument();
    expect(menuBar).toHaveStyle('background: transparent');
    fireEvent.scroll(window, { target: { scrollY: 100 } });
    expect(menuBar).toHaveStyle('background: #fff');
  });

  test('clic on Logo routes to Homepage', async () => {
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

  test('clic on custom Logo routes to Homepage', async () => {
    useSiteConfig.setState({
      siteConfig: {
        is_default_site: false,
        footer_copyright: 'custom copyright',
        logo_url: 'https://example.com/logo.svg',
        login_html: 'custom login markdown',
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

  test('clic on custom Logo routes to Homepage with default logo', async () => {
    useSiteConfig.setState({
      siteConfig: {
        is_default_site: false,
        footer_copyright: 'custom copyright',
        logo_url: undefined,
        login_html: 'custom login markdown',
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
});

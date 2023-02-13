import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCurrentUser, userMockFactory } from 'lib-components';
import { render, wrapInRouter } from 'lib-tests';

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
    expect(screen.getByRole(/menubar/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  });

  test('scroll and update background', () => {
    render(<Header />);

    const menuBar = screen.getByRole(/menubar/i);
    expect(menuBar).toBeInTheDocument();
    expect(menuBar).toHaveStyle('background: transparent');
    fireEvent.scroll(window, { target: { scrollY: 100 } });
    expect(menuBar).toHaveStyle('background: #fff');
  });

  test('clic on Logo routes to Homepage', () => {
    render(
      wrapInRouter(
        <div>My Homepage</div>,
        [
          {
            path: '/videos',
            exact: true,
            children: <div>My Videos</div>,
          },
        ],
        '/',
        ['/videos'],
        <Header />,
      ),
    );

    const logo = screen.getByText(/logo_marsha.svg/i);
    expect(logo).toBeInTheDocument();
    expect(screen.getByText(/My Videos/i)).toBeInTheDocument();
    expect(screen.queryByText(/My Homepage/i)).not.toBeInTheDocument();
    userEvent.click(logo);
    expect(screen.getByText(/My Homepage/i)).toBeInTheDocument();
    expect(screen.queryByText(/My Videos/i)).not.toBeInTheDocument();
  });
});

import { screen } from '@testing-library/react';
import { AnonymousUser, useCurrentUser } from 'lib-components';
import { render } from 'lib-tests';

import { ProfilePage } from './ProfilePage';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useCurrentUser: jest.fn(),
}));
const mockedUseCurrentUser = useCurrentUser as jest.MockedFunction<
  typeof useCurrentUser
>;

jest.mock('features/Contents', () => ({
  Contents: () => <span>classrooms</span>,
}));

describe('<ProfilePage />', () => {
  it('only renders classrooms without user', () => {
    mockedUseCurrentUser.mockReturnValue({ currentUser: null });

    render(<ProfilePage />);

    expect(screen.getByText('classrooms')).toBeInTheDocument();
    expect(screen.getByText('No name provided')).toBeInTheDocument();
    expect(screen.getByText('No email provided')).toBeInTheDocument();
  });

  it('only renders classrooms with anonymous user', () => {
    mockedUseCurrentUser.mockReturnValue({
      currentUser: AnonymousUser.ANONYMOUS,
    });

    render(<ProfilePage />);

    expect(screen.getByText('classrooms')).toBeInTheDocument();
    expect(screen.getByText('No name provided')).toBeInTheDocument();
    expect(screen.getByText('No email provided')).toBeInTheDocument();
  });

  it('renders user infos when provided', () => {
    mockedUseCurrentUser.mockReturnValue({
      currentUser: { full_name: 'my full name', email: 'my-email@openfun.fr' },
    });

    render(<ProfilePage />);

    expect(screen.getByText('classrooms')).toBeInTheDocument();
    expect(screen.getByText('my full name')).toBeInTheDocument();
    expect(screen.getByText('my-email@openfun.fr')).toBeInTheDocument();
  });
});

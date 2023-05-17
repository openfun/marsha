import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { ProfileRouter } from './ProfileRouter';

jest.mock('./ProfilePage', () => ({
  ProfilePage: () => <div>My ProfilePage</div>,
}));

jest.mock('./SettingsProfilePage', () => ({
  SettingsProfilePage: () => <div>My SettingsProfilePage</div>,
}));

describe('<ProfileRouter/>', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('render route /my-profile', () => {
    render(<ProfileRouter />, {
      routerOptions: {
        history: ['/my-profile'],
      },
    });
    expect(screen.getByText(/My ProfilePage/i)).toBeInTheDocument();
  });

  test('render route /my-profile/settings', () => {
    render(<ProfileRouter />, {
      routerOptions: { history: ['/my-profile/settings'] },
    });

    expect(screen.getByText(/My SettingsProfilePage/i)).toBeInTheDocument();
  });

  test('render bad route', () => {
    render(<ProfileRouter />, {
      routerOptions: { history: ['/my-profile/bad-road'] },
    });

    expect(
      screen.getByText(/Sorry, this page does not exist./i),
    ).toBeInTheDocument();
  });
});

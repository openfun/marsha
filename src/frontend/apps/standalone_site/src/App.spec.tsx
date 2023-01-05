import { render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useCurrentUser, userMockFactory } from 'lib-components';

import fetchMockAuth from '__mock__/fetchMockAuth.mock';

import App from './App';

fetchMockAuth();

const consoleWarn = jest
  .spyOn(console, 'warn')
  .mockImplementation(() => jest.fn());

window.scrollTo = jest.fn();

describe('<App />', () => {
  beforeEach(() => {
    useCurrentUser.setState({
      currentUser: undefined,
    });
  });

  afterEach(() => {
    fetchMock.restore();
    consoleWarn.mockClear();
    jest.resetAllMocks();
  });

  test('renders <App />', async () => {
    useCurrentUser.setState({
      currentUser: userMockFactory({
        full_name: 'John Doe',
      }),
    });
    render(<App />);

    expect(await screen.findByText(/John Doe/i)).toBeInTheDocument();
    expect(
      screen.getByRole(/menuitem/i, { name: /My playlists/i }),
    ).toBeInTheDocument();
    expect(consoleWarn).toHaveBeenCalled();
  });

  test('renders with another language', async () => {
    useCurrentUser.setState({
      currentUser: userMockFactory({
        full_name: 'John Doe',
      }),
    });
    jest.mock(
      'translations/fr_FR.json',
      () => ({
        'features.HomePage.HomePage': 'Mon Accueil',
        'routes.routes.menuHomePageLabel': 'Mon Tableau de bord',
      }),
      { virtual: true },
    );
    const languageGetter = jest.spyOn(window.navigator, 'language', 'get');
    languageGetter.mockReturnValue('fr');

    render(<App />);

    expect(await screen.findByText(/John Doe/i)).toBeInTheDocument();
    expect(
      screen.getByRole(/menuitem/i, { name: /Mon Tableau de bord/i }),
    ).toBeInTheDocument();
  });
});

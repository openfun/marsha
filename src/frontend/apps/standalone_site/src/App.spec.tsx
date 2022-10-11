import { render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';

import App from './App';

const mockedLocation = {
  search: 'token=some-token',
  assign: jest.fn(),
  replace: jest.fn(),
} as any;
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockedLocation,
}));

fetchMock.post('/api/auth/challenge/', { access: 'some-access' });
fetchMock.get('/api/users/whoami/', {
  date_joined: 'date_joined',
  email: 'email',
  first_name: 'first_name',
  id: 'id',
  is_staff: false,
  is_superuser: false,
  last_name: 'last_name',
  organization_accesses: [],
});
const consoleWarn = jest
  .spyOn(console, 'warn')
  .mockImplementation(() => jest.fn());

describe('<App />', () => {
  afterEach(() => {
    fetchMock.restore();
    consoleWarn.mockClear();
    jest.resetAllMocks();
  });

  test('renders <App />', async () => {
    render(<App />);

    expect(await screen.findByText(/Homepage/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(
      screen.getByRole(/menuitem/i, { name: /Favorites/i }),
    ).toBeInTheDocument();
    expect(consoleWarn).toHaveBeenCalled();
  });

  test('renders with another language', async () => {
    jest.mock(
      'translations/fr.json',
      () => ({
        'features.HomePage.HomePage': 'Mon Accueil',
        'routes.routes.menuHomePageLabel': 'Mon Tableau de bord',
      }),
      { virtual: true },
    );
    const languageGetter = jest.spyOn(window.navigator, 'language', 'get');
    languageGetter.mockReturnValue('fr');

    render(<App />);

    expect(await screen.findByText(/Mon Accueil/i)).toBeInTheDocument();
    expect(
      screen.getByRole(/menuitem/i, { name: /Mon Tableau de bord/i }),
    ).toBeInTheDocument();
  });
});

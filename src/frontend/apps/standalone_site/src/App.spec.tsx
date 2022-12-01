import { render, screen } from '@testing-library/react';
import fetchMockAuth from '__mock__/fetchMockAuth.mock';
import fetchMock from 'fetch-mock';

import App from './App';

fetchMockAuth();

const consoleWarn = jest
  .spyOn(console, 'warn')
  .mockImplementation(() => jest.fn());

window.scrollTo = jest.fn();

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
      screen.getByRole(/menuitem/i, { name: /My playlists/i }),
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

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

describe('<App />', () => {
  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  test('renders <App />', async () => {
    render(<App />);

    expect(await screen.findByText(/Accueil/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(
      screen.getByRole(/menuitem/i, { name: /Favorites/i }),
    ).toBeInTheDocument();
  });
});

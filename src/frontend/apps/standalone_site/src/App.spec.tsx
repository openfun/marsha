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

test('renders learn react link', async () => {
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

  render(<App />);

  expect(
    await screen.findByRole(/menuitem/i, { name: /Favorites/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  expect(screen.getByText(/Accueil/i)).toBeInTheDocument();
});

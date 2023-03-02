import fetchMock from 'fetch-mock';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    search: 'token=some-token',
    assign: jest.fn(),
    replace: jest.fn(),
  }),
}));

export default () => {
  fetchMock.post('/api/auth/challenge/', {
    access: 'some-access',
    refresh: 'some-refresh',
  });
  fetchMock.get('/api/users/whoami/', {
    date_joined: 'date_joined',
    email: 'email',
    full_name: 'full name',
    id: 'id',
    is_staff: false,
    is_superuser: false,
    organization_accesses: [],
  });
};

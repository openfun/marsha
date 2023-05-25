import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Deferred, render } from 'lib-tests';

import PagesApi from './PagesApi';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: '/cgi',
  }),
}));

describe('<PagesApi />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders AppRoutes', async () => {
    const deferred = new Deferred();
    fetchMock.get('/api/pages/cgi/', deferred.promise);

    render(<PagesApi />);

    expect(
      screen.getByRole(/alert/i, { name: /spinner/i }),
    ).toBeInTheDocument();

    deferred.resolve({
      status: 200,
      body: {
        content: 'My CGI',
      },
    });

    expect(await screen.findByText(/My CGI/i)).toBeInTheDocument();
  });
});

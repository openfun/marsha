import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { render } from 'lib-tests';

import { RenaterAuthenticator } from './RenaterAuthenticator';

const replace = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    replace,
  },
});

describe('<RenaterAuthenticator />', () => {
  beforeEach(() => {
    fetchMock.get('/account/api/saml/renater_fer_idp_list/', [
      {
        display_name: 'Fake IdP 1',
        login_url: 'http://fake-idp-1',
      },
      {
        display_name: 'Fake IdP 2',
        login_url: 'http://fake-idp-2',
      },
      {
        display_name: 'Fake IdP 3',
        login_url: 'http://fake-idp-3',
      },
      {
        display_name: 'Fake IdP 4',
        login_url: 'http://fake-idp-4',
      },
      {
        display_name: 'Local accepting IdP',
        login_url: 'http://local-accepting-idp',
      },
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('checks render', async () => {
    render(<RenaterAuthenticator />);

    expect(screen.getByText(/OR LOGIN WITH/i)).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: /Open Drop/i }));

    expect(
      await screen.findByRole('option', { name: /Fake IdP 1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /Fake IdP 2/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /Local accepting IdP/i }),
    ).toBeInTheDocument();
  });

  it('checks search selectbox', async () => {
    render(<RenaterAuthenticator />);

    userEvent.click(screen.getByRole('button', { name: /Open Drop/i }));

    expect(
      await screen.findByRole('option', { name: /Fake IdP 1/i }),
    ).toBeInTheDocument();

    userEvent.type(screen.getByRole('searchbox'), 'Local');

    expect(
      await screen.findByRole('option', { name: /Local accepting IdP/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /Fake IdP 1/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /Fake IdP 2/i }),
    ).not.toBeInTheDocument();

    userEvent.clear(screen.getByRole('searchbox'));

    expect(
      await screen.findByRole('option', { name: /Fake IdP 2/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('option', { name: /Fake IdP 1/i }),
    ).toBeInTheDocument();
  });

  it('checks redirect', async () => {
    render(<RenaterAuthenticator />);

    userEvent.click(screen.getByRole('button', { name: /Open Drop/i }));

    userEvent.click(
      await screen.findByRole('option', { name: /Local accepting IdP/i }),
    );

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('http://local-accepting-idp'),
    );
  });
});

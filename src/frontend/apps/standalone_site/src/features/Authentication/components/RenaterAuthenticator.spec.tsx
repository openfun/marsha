import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { render } from 'lib-tests';

import { RenaterAuthenticator } from './RenaterAuthenticator';

const assign = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    assign,
  },
});

describe('<RenaterAuthenticator />', () => {
  beforeEach(() => {
    fetchMock.get('/account/api/saml/renater_fer_idp_list/', [
      {
        display_name: 'Fake IdP 1',
        login_url: 'http://fake-idp-1',
        logo: '',
      },
      {
        display_name: 'Fake IdP 2',
        login_url: 'http://fake-idp-2',
        logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/M7ubXdtdb1xSFyeilBapySVU8h8OoFaooFSqiihIVIpQBKci6KEg9Q6H9kovIHoCIVQJJCKE1ENFjnAgcaSGC6rEnxBwA04Tx43t2FnvDAfjkNibxgHxnWb2e/u992bee7tCa00YFsffekFY+nUzFtjW0LrvjRXrCDIAaPLlW0nHL0SsZtVoaF98mLrx3pdhOqLtYPHChahZcYYO7KvPFxvRl5XPp1sN3adWiD1ZAqD6XYK1b/dvE5IWryTt2udLFedwc1+9kLp+vbbpoDh+6TklxBeAi9TL0taeWpdmZzQDry0AcO+jQ12RyohqqoYoo8RDwJrU+qXkjWtfi8Xxt58BdQuwQs9qC/afLwCw8tnQbqYAPsgxE1S6F3EAIXux2oQFKm0ihMsOF71dHYx+f3NND68ghCu1YIoePPQN1pGRABkJ6Bus96CutRZMydTl+TvuiRW1m3n0eDl0vRPcEysqdXn+jsQPsrHMquGeXEaY4Yk4wxWcY5V/9scqOMOVUFthatyTy8QyqwZ+kDURKoMWxNKr2EeqVKcTNOajqKoBgOE28U4tdQl5p5bwCw7BWquaZSzAPlwjlithJtp3pTImSqQRrb2Z8PHGigD4RZuNX6JYj6wj7O4TFLbCO/Mn/m8R+h6rYSUb3ekokRY6f/YukArN979jcW+V/S8g0eT/N3VN3kTqWbQ428m9/8k0P/1aIhF36PccEl6EhOcAUCrXKZXXWS3XKd2vc/TRBG9O5ELC17MmWubD2nKhUKZa26Ba2+D3P+4/MNCFwg59oWVeYhkzgN/JDR8deKBoD7Y+ljEjGZ0sosXVTvbc6RHirr2reNy1OXd6pJsQ+gqjk8VWFYmHrwBzW/n+uMPFiRwHB2I7ih8ciHFxIkd/3Omk5tCDV1t+2nNu5sxxpDFNx+huNhVT3/zMDz8usXC3ddaHBj1GHj/As08fwTS7Kt1HBTmyN29vdwAw+/wbwLVOJ3uAD1wi/dUH7Qei66PfyuRj4Ik9is+hglfbkbfR3cnZm7chlUWLdwmprtCohX4HUtlOcQjLYCu+fzGJH2QRKvP3UNz8bWk1qMxjGTOMThZ3kvgLI5AzFfo379UAAAAASUVORK5CYII=',
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

    const firstIdp = await screen.findByRole('option', { name: /Fake IdP 1/i });
    const secondIdp = screen.getByRole('option', { name: /Fake IdP 2/i });
    const thirdIdp = screen.getByRole('option', { name: /Fake IdP 3/i });
    const fourthIdp = screen.getByRole('option', { name: /Fake IdP 4/i });
    const localIdp = screen.getByRole('option', {
      name: /Local accepting IdP/i,
    });

    expect(firstIdp).toBeInTheDocument();
    expect(secondIdp).toBeInTheDocument();
    expect(thirdIdp).toBeInTheDocument();
    expect(fourthIdp).toBeInTheDocument();
    expect(localIdp).toBeInTheDocument();

    // Check that the logo is displayed
    const firstIdpLogo = within(firstIdp).getByRole('img');
    expect(firstIdpLogo).toBeInTheDocument();
    expect(firstIdpLogo).toHaveAttribute(
      'src',
      'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
    );

    const secondIdpLogo = within(secondIdp).getByRole('img');
    expect(secondIdpLogo).toBeInTheDocument();
    expect(secondIdpLogo).toHaveAttribute(
      'src',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/M7ubXdtdb1xSFyeilBapySVU8h8OoFaooFSqiihIVIpQBKci6KEg9Q6H9kovIHoCIVQJJCKE1ENFjnAgcaSGC6rEnxBwA04Tx43t2FnvDAfjkNibxgHxnWb2e/u992bee7tCa00YFsffekFY+nUzFtjW0LrvjRXrCDIAaPLlW0nHL0SsZtVoaF98mLrx3pdhOqLtYPHChahZcYYO7KvPFxvRl5XPp1sN3adWiD1ZAqD6XYK1b/dvE5IWryTt2udLFedwc1+9kLp+vbbpoDh+6TklxBeAi9TL0taeWpdmZzQDry0AcO+jQ12RyohqqoYoo8RDwJrU+qXkjWtfi8Xxt58BdQuwQs9qC/afLwCw8tnQbqYAPsgxE1S6F3EAIXux2oQFKm0ihMsOF71dHYx+f3NND68ghCu1YIoePPQN1pGRABkJ6Bus96CutRZMydTl+TvuiRW1m3n0eDl0vRPcEysqdXn+jsQPsrHMquGeXEaY4Yk4wxWcY5V/9scqOMOVUFthatyTy8QyqwZ+kDURKoMWxNKr2EeqVKcTNOajqKoBgOE28U4tdQl5p5bwCw7BWquaZSzAPlwjlithJtp3pTImSqQRrb2Z8PHGigD4RZuNX6JYj6wj7O4TFLbCO/Mn/m8R+h6rYSUb3ekokRY6f/YukArN979jcW+V/S8g0eT/N3VN3kTqWbQ428m9/8k0P/1aIhF36PccEl6EhOcAUCrXKZXXWS3XKd2vc/TRBG9O5ELC17MmWubD2nKhUKZa26Ba2+D3P+4/MNCFwg59oWVeYhkzgN/JDR8deKBoD7Y+ljEjGZ0sosXVTvbc6RHirr2reNy1OXd6pJsQ+gqjk8VWFYmHrwBzW/n+uMPFiRwHB2I7ih8ciHFxIkd/3Omk5tCDV1t+2nNu5sxxpDFNx+huNhVT3/zMDz8usXC3ddaHBj1GHj/As08fwTS7Kt1HBTmyN29vdwAw+/wbwLVOJ3uAD1wi/dUH7Qei66PfyuRj4Ik9is+hglfbkbfR3cnZm7chlUWLdwmprtCohX4HUtlOcQjLYCu+fzGJH2QRKvP3UNz8bWk1qMxjGTOMThZ3kvgLI5AzFfo379UAAAAASUVORK5CYII=',
    );

    const thirdIdpLogo = within(thirdIdp).getByRole('img');
    expect(thirdIdpLogo).toBeInTheDocument();
    expect(thirdIdpLogo).toHaveAttribute(
      'src',
      'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
    );

    const fourthIdpLogo = within(fourthIdp).getByRole('img');
    expect(fourthIdpLogo).toBeInTheDocument();
    expect(fourthIdpLogo).toHaveAttribute(
      'src',
      'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
    );

    const localIdpLogo = within(localIdp).getByRole('img');
    expect(localIdpLogo).toBeInTheDocument();
    expect(localIdpLogo).toHaveAttribute(
      'src',
      'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
    );
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
      expect(assign).toHaveBeenCalledWith('http://local-accepting-idp'),
    );
  });

  it('checks error card is displayed correctly', async () => {
    render(<RenaterAuthenticator />, {
      routerOptions: {
        history: ['/?error=social-auth'],
      },
    });

    userEvent.click(screen.getByRole('button', { name: /Open Drop/i }));

    expect(
      await screen.findByRole('option', { name: /Fake IdP 1/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Sorry, a problem occured. Please try again./i),
    ).toBeInTheDocument();
  });

  it('checks error card message is displayed correctly', async () => {
    render(<RenaterAuthenticator />, {
      routerOptions: {
        history: [
          '/?error=social-auth&message=Authentication%20failed%3A%20SAML%20login%20failed',
        ],
      },
    });

    userEvent.click(screen.getByRole('button', { name: /Open Drop/i }));

    expect(
      await screen.findByRole('option', { name: /Fake IdP 1/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Sorry, a problem occured. Please try again./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Authentication failed: SAML login failed/i),
    ).toBeInTheDocument();
  });
});

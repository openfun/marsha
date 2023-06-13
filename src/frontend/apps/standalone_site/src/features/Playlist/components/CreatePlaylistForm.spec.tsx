import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { APIList, Organization } from 'lib-components';
import { Deferred, render } from 'lib-tests';
import { setLogger } from 'react-query';

import { routes } from 'routes';

import { CreatePlaylistForm } from './CreatePlaylistForm';

setLogger({
  log: console.log,
  warn: console.warn,
  // no more errors on the console
  error: () => {},
});

const organizationResult = {
  count: 1,
  results: [
    {
      id: 'id',
      name: 'org',
      created_on: 'some days',
      users: [],
      consumer_sites: ['consumer site 1'],
    },
    {
      id: 'other-id',
      name: 'other-org',
      created_on: 'some days',
      users: [],
      consumer_sites: ['consumer site 1'],
    },
  ],
};

describe('<CreatePlaylistForm />', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it('displays a loader while fetching organizations', async () => {
    const deferred = new Deferred<APIList<Organization>>();
    fetchMock.get('/api/organizations/?limit=20&offset=0', deferred.promise);

    render(<CreatePlaylistForm />);

    const loader = screen.getByRole('status');
    expect(loader).toBeInTheDocument();

    deferred.resolve(organizationResult);

    await waitForElementToBeRemoved(loader);

    expect(screen.getByText('Create a playlist')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create playlist' }),
    ).toBeInTheDocument();
  });

  it('displays an error if organization fetch failed', async () => {
    fetchMock.get('/api/organizations/?limit=20&offset=0', 500);

    render(<CreatePlaylistForm />);

    expect(
      await screen.findByText('An error occurred, please try again later.'),
    ).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: 'Retry' });
    expect(retryButton).toBeInTheDocument();

    fetchMock.get('/api/organizations/?limit=20&offset=0', organizationResult, {
      overwriteRoutes: true,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByText('Create a playlist')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create playlist' }),
    ).toBeInTheDocument();
  });

  it('submits the form', async () => {
    fetchMock.get('/api/organizations/?limit=20&offset=0', organizationResult);
    fetchMock.post('/api/playlists/', {});

    render(<CreatePlaylistForm />, {
      routerOptions: {
        routes: [
          {
            path: routes.PLAYLIST.path,
            element: <div>playlist page</div>,
          },
        ],
      },
    });

    expect(await screen.findByText('Create a playlist')).toBeInTheDocument();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Open Drop; Selected: id' }),
    );

    await userEvent.click(
      await screen.findByRole('option', { name: 'other-org' }),
    );

    expect(
      await screen.findByRole('button', {
        name: 'Open Drop; Selected: other-id',
      }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('other-org')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('org')).not.toBeInTheDocument();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Name required' }),
      'some name',
    );

    expect(screen.queryByText('playlist page')).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Create playlist' }),
    );

    expect(await screen.findByText('playlist page')).toBeInTheDocument();
  });
});

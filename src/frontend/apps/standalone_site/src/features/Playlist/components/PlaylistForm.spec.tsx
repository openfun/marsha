import { Button } from '@openfun/cunningham-react';
import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { Deferred, render } from 'lib-tests';

import { PlaylistForm } from './PlaylistForm';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('<PlaylistForm />', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    fetchMock.restore();
  });

  it('render the form without title', async () => {
    const deferred = new Deferred<{ count: number; results: any[] }>();
    fetchMock.mock('/api/organizations/?limit=20&offset=0', deferred.promise);

    render(
      <PlaylistForm
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        submitTitle="Save"
        isSubmitting={false}
        actions={<Button>Edit</Button>}
      />,
    );

    //  loader is visible
    const loader = screen.getByRole('status');
    expect(loader).toBeInTheDocument();
    expect(
      screen.queryByText('An error occurred, please try again later.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Organization')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Retention Date')).not.toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit' }),
    ).not.toBeInTheDocument();

    //  form is visible once organizations have been fetched
    deferred.resolve({ count: 0, results: [] });

    await waitForElementToBeRemoved(loader);
    expect(
      await screen.findByRole('combobox', {
        name: 'Organization',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: 'Save' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('selects the first organization if any', async () => {
    fetchMock.mock('/api/organizations/?limit=20&offset=0', {
      count: 2,
      results: [
        { id: 'first id', name: 'first organization' },
        { id: 'second id', name: 'second organization' },
      ],
    });

    render(
      <PlaylistForm
        title="some form title"
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        submitTitle="Save"
        isSubmitting={false}
        actions={<Button>Edit</Button>}
      />,
    );

    expect(
      await screen.findByRole('combobox', {
        name: 'Organization',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('first organization')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'some form title' }),
    ).toBeInTheDocument();
  });

  it('init the form with values', async () => {
    fetchMock.mock('/api/organizations/?limit=20&offset=0', {
      count: 21,
      results: [
        { id: 'first id', name: 'first organization' },
        { id: 'second id', name: 'second organization' },
      ],
    });
    fetchMock.mock('/api/organizations/?limit=20&offset=20', {
      count: 21,
      results: [{ id: 'third id', name: 'third organization' }],
    });

    render(
      <PlaylistForm
        title="some form title"
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        submitTitle="Save"
        isSubmitting={false}
        actions={<Button>Edit</Button>}
        initialValues={{
          name: 'some initial name',
          organizationId: 'second id',
        }}
      />,
    );

    expect(
      await screen.findByRole('combobox', {
        name: 'Organization',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('second organization')).toBeInTheDocument();
    expect(screen.getByDisplayValue('some initial name')).toBeInTheDocument();

    expect(fetchMock.calls().length).toEqual(1);
    expect(fetchMock.calls()[0][0]).toEqual(
      '/api/organizations/?limit=20&offset=0',
    );

    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeDisabled();
  });

  it('loads organizations until it find the initial one', async () => {
    fetchMock.mock('/api/organizations/?limit=20&offset=0', {
      count: 21,
      results: [
        { id: 'first id', name: 'first organization' },
        { id: 'second id', name: 'second organization' },
      ],
    });
    fetchMock.mock('/api/organizations/?limit=20&offset=20', {
      count: 21,
      results: [{ id: 'third id', name: 'third organization' }],
    });

    render(
      <PlaylistForm
        title="some form title"
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        submitTitle="Save"
        isSubmitting={false}
        actions={<Button>Edit</Button>}
        initialValues={{
          name: 'some initial name',
          organizationId: 'third id',
        }}
      />,
    );

    expect(
      await screen.findByRole('combobox', {
        name: 'Organization',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('third organization')).toBeInTheDocument();
    expect(screen.getByDisplayValue('some initial name')).toBeInTheDocument();

    expect(fetchMock.calls().length).toEqual(2);
    expect(fetchMock.calls()[0][0]).toEqual(
      '/api/organizations/?limit=20&offset=0',
    );
    expect(fetchMock.calls()[1][0]).toEqual(
      '/api/organizations/?limit=20&offset=20',
    );
  });

  it('reset organization initial form value if none could be found with this id', async () => {
    fetchMock.mock('/api/organizations/?limit=20&offset=0', {
      count: 21,
      results: [
        { id: 'first id', name: 'first organization' },
        { id: 'second id', name: 'second organization' },
      ],
    });
    fetchMock.mock('/api/organizations/?limit=20&offset=20', {
      count: 21,
      results: [{ id: 'fourth id', name: 'fourth organization' }],
    });

    render(
      <PlaylistForm
        title="some form title"
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        submitTitle="Save"
        isSubmitting={false}
        actions={<Button>Edit</Button>}
        initialValues={{
          name: 'some initial name',
          organizationId: 'third id',
        }}
      />,
    );

    expect(
      await screen.findByRole('combobox', {
        name: 'Organization',
      }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('some initial name')).toBeInTheDocument();

    expect(fetchMock.calls().length).toEqual(2);
    expect(fetchMock.calls()[0][0]).toEqual(
      '/api/organizations/?limit=20&offset=0',
    );
    expect(fetchMock.calls()[1][0]).toEqual(
      '/api/organizations/?limit=20&offset=20',
    );
  });

  it('calls callback on button clicks', async () => {
    fetchMock.mock('/api/organizations/?limit=20&offset=0', {
      count: 21,
      results: [
        { id: 'first id', name: 'first organization' },
        { id: 'second id', name: 'second organization' },
      ],
    });
    fetchMock.mock('/api/organizations/?limit=20&offset=20', {
      count: 21,
      results: [{ id: 'third id', name: 'third organization' }],
    });

    const mockedOnSubmit = jest.fn();
    const mockedOnCancel = jest.fn();

    render(
      <PlaylistForm
        title="some form title"
        onSubmit={mockedOnSubmit}
        onCancel={mockedOnCancel}
        submitTitle="Save"
        isSubmitting={false}
        actions={<Button>Edit</Button>}
        initialValues={{
          name: 'some initial name',
          organizationId: 'third id',
          retention_duration: 365,
        }}
      />,
    );

    expect(
      await screen.findByRole('combobox', {
        name: 'Organization',
      }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockedOnSubmit).toHaveBeenCalled());
    expect(mockedOnSubmit).toHaveBeenCalledWith({
      name: 'some initial name',
      organizationId: 'third id',
      retention_duration: 365,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(mockedOnCancel).toHaveBeenCalled());
  });

  it('displays an error if we fail to load organizations', async () => {
    fetchMock.mock('/api/organizations/?limit=20&offset=0', 500);

    render(
      <PlaylistForm
        title="some form title"
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        submitTitle="Save"
        isSubmitting={false}
        actions={<Button>Edit</Button>}
        initialValues={{
          name: 'some initial name',
          organizationId: 'third id',
        }}
      />,
    );

    expect(
      await screen.findByText('An error occurred, please try again later.'),
    ).toBeInTheDocument();

    fetchMock.mock(
      '/api/organizations/?limit=20&offset=0',
      {
        count: 2,
        results: [
          { id: 'first id', name: 'first organization' },
          { id: 'second id', name: 'second organization' },
        ],
      },
      { overwriteRoutes: true },
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByRole('combobox', {
        name: 'Organization',
      }),
    ).toBeInTheDocument();
  });

  it('resets the state on cancel', async () => {
    fetchMock.mock('/api/organizations/?limit=20&offset=0', {
      count: 2,
      results: [
        { id: 'first id', name: 'first organization' },
        { id: 'second id', name: 'second organization' },
      ],
    });

    const mockedOnCancel = jest.fn();
    render(
      <PlaylistForm
        title="some form title"
        onSubmit={jest.fn()}
        onCancel={mockedOnCancel}
        submitTitle="Save"
        isSubmitting={false}
        actions={<Button>Edit</Button>}
        initialValues={{
          name: 'some initial name',
          organizationId: 'first id',
        }}
      />,
    );

    expect(
      await screen.findByRole('combobox', {
        name: 'Organization',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('first organization')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('some initial name')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete playlist' }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('first organization'));
    await userEvent.click(
      await screen.findByRole('option', { name: 'second organization' }),
    );

    await userEvent.clear(screen.getByLabelText('Name'));
    await userEvent.type(
      screen.getByLabelText('Name'),
      'an other awesome name',
    );

    expect(screen.getByText('second organization')).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue('an other awesome name'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(mockedOnCancel).toHaveBeenCalled());

    expect(
      await screen.findByRole('combobox', {
        name: 'Organization',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('first organization')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('some initial name')).toBeInTheDocument();
  });

  it('renders the component with the delete button if a playlistId is provided', async () => {
    fetchMock.mock('/api/organizations/?limit=20&offset=0', {
      count: 1,
      results: [{ id: 'first id', name: 'first organization' }],
    });

    render(
      <PlaylistForm
        title="some form title"
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        submitTitle="Save"
        isSubmitting={false}
        actions={<Button>Edit</Button>}
        playlistId="123"
      />,
    );

    expect(
      await screen.findByRole('combobox', {
        name: 'Organization',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('first organization')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete playlist' }),
    ).toBeInTheDocument();
  });

  it('fails to delete the playlist because of attached resources', async () => {
    fetchMock.mock('/api/organizations/?limit=20&offset=0', {
      count: 1,
      results: [{ id: 'first id', name: 'first organization' }],
    });

    fetchMock.delete('/api/playlists/123/', 400);

    render(
      <PlaylistForm
        title="some form title"
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        submitTitle="Save"
        isSubmitting={false}
        actions={<Button>Edit</Button>}
        playlistId="123"
      />,
    );

    expect(
      await screen.findByRole('combobox', {
        name: 'Organization',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('first organization')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();

    const deleteButton = screen.getByRole('button', {
      name: 'Delete playlist',
    });
    await userEvent.click(deleteButton);

    const confirmDeleteButton = await screen.findByRole('button', {
      name: 'Confirm delete playlist',
    });
    await userEvent.click(confirmDeleteButton);

    expect(
      await screen.findByText(
        'An error occurred, All attached resources must be deleted first.',
      ),
    ).toBeInTheDocument();
  });

  it('fails to delete the playlist because of permission denied', async () => {
    fetchMock.mock('/api/organizations/?limit=20&offset=0', {
      count: 1,
      results: [{ id: 'first id', name: 'first organization' }],
    });

    fetchMock.delete('/api/playlists/123/', 403);

    render(
      <PlaylistForm
        title="some form title"
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        submitTitle="Save"
        isSubmitting={false}
        actions={<Button>Edit</Button>}
        playlistId="123"
      />,
    );

    expect(
      await screen.findByRole('combobox', {
        name: 'Organization',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('first organization')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();

    const deleteButton = screen.getByRole('button', {
      name: 'Delete playlist',
    });
    await userEvent.click(deleteButton);

    const confirmDeleteButton = await screen.findByRole('button', {
      name: 'Confirm delete playlist',
    });
    await userEvent.click(confirmDeleteButton);

    expect(
      await screen.findByText('An error occurred, please try again later.'),
    ).toBeInTheDocument();
  });

  it('successfully deletes the playlist', async () => {
    fetchMock.mock('/api/organizations/?limit=20&offset=0', {
      count: 1,
      results: [{ id: 'first id', name: 'first organization' }],
    });
    fetchMock.delete('/api/playlists/123/', 204);

    render(
      <PlaylistForm
        title="some form title"
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        submitTitle="Save"
        isSubmitting={false}
        actions={<Button>Edit</Button>}
        playlistId="123"
      />,
    );

    expect(
      await screen.findByRole('combobox', {
        name: 'Organization',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('first organization')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();

    const deleteButton = screen.getByRole('button', {
      name: 'Delete playlist',
    });
    await userEvent.click(deleteButton);

    const confirmDeleteButton = await screen.findByRole('button', {
      name: 'Confirm delete playlist',
    });
    await userEvent.click(confirmDeleteButton);

    expect(
      await screen.findByText('Playlist deleted with success.'),
    ).toBeInTheDocument();
  });
});

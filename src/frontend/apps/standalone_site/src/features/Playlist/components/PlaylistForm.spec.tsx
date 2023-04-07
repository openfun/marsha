import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { Button } from 'grommet';
import { Deferred, render } from 'lib-tests';
import { setLogger } from 'react-query';

import { PlaylistForm } from './PlaylistForm';

setLogger({
  log: console.log,
  warn: console.warn,
  // no more errors on the console
  error: () => {},
});

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
        actions={<Button label="Edit" />}
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
    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit' }),
    ).not.toBeInTheDocument();

    //  form is visible once organizations have been fetched
    deferred.resolve({ count: 0, results: [] });

    await waitForElementToBeRemoved(loader);
    expect(screen.getByLabelText('Organization*required')).toBeInTheDocument();
    expect(screen.getByLabelText('Name*required')).toBeInTheDocument();

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
        actions={<Button label="Edit" />}
      />,
    );

    expect(
      await screen.findByLabelText('Organization*required'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Open Drop; Selected: first id',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Name*required')).toBeInTheDocument();

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
        actions={<Button label="Edit" />}
        initialValues={{
          name: 'some initial name',
          organizationId: 'second id',
        }}
      />,
    );

    expect(
      await screen.findByLabelText('Organization*required'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Open Drop; Selected: second id',
      }),
    ).toBeInTheDocument();
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
        actions={<Button label="Edit" />}
        initialValues={{
          name: 'some initial name',
          organizationId: 'third id',
        }}
      />,
    );

    expect(
      await screen.findByLabelText('Organization*required'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Open Drop; Selected: third id',
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
        actions={<Button label="Edit" />}
        initialValues={{
          name: 'some initial name',
          organizationId: 'third id',
        }}
      />,
    );

    expect(
      await screen.findByLabelText('Organization*required'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Open Drop',
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
        actions={<Button label="Edit" />}
        initialValues={{
          name: 'some initial name',
          organizationId: 'third id',
        }}
      />,
    );

    expect(
      await screen.findByLabelText('Organization*required'),
    ).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockedOnSubmit).toHaveBeenCalled());
    expect(mockedOnSubmit).toHaveBeenCalledWith({
      name: 'some initial name',
      organizationId: 'third id',
    });

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

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
        actions={<Button label="Edit" />}
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
    userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByLabelText('Organization*required'),
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
        actions={<Button label="Edit" />}
        initialValues={{
          name: 'some initial name',
          organizationId: 'first id',
        }}
      />,
    );

    expect(
      await screen.findByLabelText('Organization*required'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Open Drop; Selected: first id',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Name*required')).toBeInTheDocument();
    expect(screen.getByDisplayValue('some initial name')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();

    userEvent.click(
      screen.getByRole('button', {
        name: 'Open Drop; Selected: first id',
      }),
    );
    userEvent.click(
      await screen.findByRole('option', { name: 'second organization' }),
    );

    userEvent.clear(screen.getByLabelText('Name*required'));
    userEvent.type(
      screen.getByLabelText('Name*required'),
      'an other awsome name',
    );

    expect(
      await screen.findByRole('button', {
        name: 'Open Drop; Selected: second id',
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue('an other awsome name'),
    ).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(mockedOnCancel).toHaveBeenCalled());

    expect(
      await screen.findByLabelText('Organization*required'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Open Drop; Selected: first id',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Name*required')).toBeInTheDocument();
    expect(screen.getByDisplayValue('some initial name')).toBeInTheDocument();
  });
});

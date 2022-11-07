import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Box, Text } from 'grommet';
import { Deferred, render } from 'lib-tests';

import { SortableTable } from '.';

describe('<SortableTable />', () => {
  it('renders rows directly', async () => {
    render(
      <SortableTable
        title="my table"
        items={[{ label: 'label 1' }, { label: 'label 2' }]}
      >
        {(item) => (
          <Box>
            <Text>{item.label}</Text>
          </Box>
        )}
      </SortableTable>,
    );

    expect(await screen.findByText('my table')).toBeInTheDocument();
    expect(screen.getByText('label 1')).toBeInTheDocument();
    expect(screen.getByText('label 2')).toBeInTheDocument();
  });

  it('renders rows, sorting, select box and pagination', async () => {
    const items = [{ label: 'label 1' }, { label: 'label 2' }];
    const sorts = [{ label: 'by name' }, { label: 'by url' }];
    const onSortChange = jest.fn().mockReturnValue([items[0]]);
    const onSelectionChange = jest.fn();
    const onPageChange = jest.fn().mockReturnValue([items[1]]);

    render(
      <SortableTable
        title="my table"
        items={[items[0]]}
        sortable
        currentSort={sorts[0]}
        sortBy={sorts}
        onSortChange={onSortChange}
        selectable
        onSelectionChange={onSelectionChange}
        paginable
        pageSize={1}
        numberOfItems={2}
        onPageChange={onPageChange}
      >
        {(item) => (
          <Box>
            <Text>{item.label}</Text>
          </Box>
        )}
      </SortableTable>,
    );

    await screen.findByText('my table');
    screen.getByText('label 1');
    expect(screen.queryByText('label 2')).not.toBeInTheDocument();

    //  sort menu tests
    expect(
      screen.getByRole('button', { name: 'Sort item in the table' }),
    ).toBeInTheDocument();
    expect(screen.getByText('by name')).toBeInTheDocument();

    userEvent.click(
      screen.getByRole('button', { name: 'Sort item in the table' }),
    );

    await screen.findByRole('menuitem', { name: 'by url' });
    expect(onSortChange).not.toHaveBeenCalled();

    userEvent.click(screen.getByRole('menuitem', { name: 'by url' }));

    await waitFor(() => expect(onSortChange).toHaveBeenCalled());
    expect(onSortChange).toHaveBeenCalledWith(sorts[1]);

    //  selection tests
    expect(
      screen.getByRole('checkbox', { name: 'Select all lines' }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Select line 1' }),
    ).not.toBeChecked();

    userEvent.click(screen.getByRole('checkbox', { name: 'Select all lines' }));
    await waitFor(() =>
      expect(
        screen.getByRole('checkbox', { name: 'Deselect all lines' }),
      ).toBeChecked(),
    );
    expect(
      screen.getByRole('checkbox', { name: 'Deselect line 1' }),
    ).toBeChecked();
    expect(onSelectionChange).toHaveBeenCalled();
    expect(onSelectionChange).toHaveBeenCalledWith([items[0]]);

    userEvent.click(screen.getByRole('checkbox', { name: 'Deselect line 1' }));
    await waitFor(() =>
      expect(
        screen.getByRole('checkbox', { name: 'Select line 1' }),
      ).not.toBeChecked(),
    );
    expect(
      screen.getByRole('checkbox', { name: 'Select all lines' }),
    ).not.toBeChecked();
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expect(onSelectionChange).toHaveBeenNthCalledWith(2, []);

    userEvent.click(screen.getByRole('checkbox', { name: 'Select line 1' }));

    //  pagination tests
    expect(
      screen.getByRole('navigation', { name: 'Pagination Navigation' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Go to previous page' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Go to page 1' }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Go to page 2' }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Go to next page' }),
    ).not.toBeDisabled();

    userEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));

    await screen.findByText('label 2');
    expect(onPageChange).toHaveBeenCalled();
    expect(onPageChange).toHaveBeenCalledWith(2);

    expect(
      screen.getByRole('button', { name: 'Go to previous page' }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Go to next page' }),
    ).toBeDisabled();

    //  selection is reset on change
    expect(
      screen.getByRole('checkbox', { name: 'Select line 1' }),
    ).toBeInTheDocument();
  });

  it('renders the loading without content', async () => {
    const items: { label: string }[] = [];

    render(
      <SortableTable title="my table" items={items} loading>
        {(item) => (
          <Box>
            <Text>{item.label}</Text>
          </Box>
        )}
      </SortableTable>,
    );

    expect(await screen.findByText('my table')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the loading on top of current content', async () => {
    const items: { label: string }[] = [{ label: 'some label' }];

    render(
      <SortableTable title="my table" items={items} loading>
        {(item) => (
          <Box>
            <Text>{item.label}</Text>
          </Box>
        )}
      </SortableTable>,
    );

    expect(await screen.findByText('my table')).toBeInTheDocument();
    expect(screen.getByText('some label')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders a loader while fetching data to render', async () => {
    const deferred = new Deferred<{ label: string }[]>();

    render(
      <SortableTable
        title="my table"
        items={async () => await deferred.promise}
      >
        {(item) => (
          <Box>
            <Text>{item.label}</Text>
          </Box>
        )}
      </SortableTable>,
    );

    await screen.findByText('my table');
    screen.getByRole('status');

    deferred.resolve([{ label: 'some label' }, { label: 'some other label' }]);

    await waitForElementToBeRemoved(() => screen.queryByRole('status'));

    expect(screen.getByText('some label')).toBeInTheDocument();
    expect(screen.getByText('some other label')).toBeInTheDocument();
  });

  it('renders a loader while loading new page context', async () => {
    const deferred = new Deferred<{ label: string }[]>();
    const onPageChange = jest.fn().mockReturnValue(deferred.promise);

    render(
      <SortableTable
        title="my table"
        items={[{ label: 'some label' }, { label: 'some other label' }]}
        paginable
        pageSize={1}
        numberOfItems={2}
        onPageChange={onPageChange}
      >
        {(item) => (
          <Box>
            <Text>{item.label}</Text>
          </Box>
        )}
      </SortableTable>,
    );

    await screen.findByText('my table');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    screen.getByText('some label');
    screen.getByText('some other label');

    userEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));

    await waitFor(() => expect(onPageChange).toHaveBeenCalled());

    await screen.findByRole('status');
    screen.getByText('some label');
    screen.getByText('some other label');

    deferred.resolve([
      { label: 'a new label' },
      { label: 'and an other one just for fun' },
    ]);

    await waitForElementToBeRemoved(() => screen.queryByRole('status'));

    screen.getByText('a new label');
    screen.getByText('and an other one just for fun');
  });

  it('renders with single selection row', () => {
    const items = [{ label: 'label 1' }, { label: 'label 2' }];
    const onSelectionChange = jest.fn();

    render(
      <SortableTable
        title="my table"
        items={items}
        selectable
        type="single"
        onSelectionChange={onSelectionChange}
      >
        {(item) => (
          <Box>
            <Text>{item.label}</Text>
          </Box>
        )}
      </SortableTable>,
    );

    screen.getByRole('radio', { name: 'Select line 1' });
    screen.getByRole('radio', { name: 'Select line 2' });
  });
});

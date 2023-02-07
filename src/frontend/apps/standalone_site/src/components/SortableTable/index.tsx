import {
  Box,
  CheckBox,
  Menu,
  Pagination,
  RadioButton,
  Stack,
  Text,
} from 'grommet';
import { Maybe } from 'lib-common';
import { Spinner } from 'lib-components';
import { Fragment, ReactNode, useEffect, useState } from 'react';
import { defineMessages } from 'react-intl';

interface SortByBase {
  label: string;
}

interface SortableTableBase<ItemType> {
  title: React.ReactNode;
  loading?: boolean;
  items: (() => Promise<ItemType[]>) | ItemType[];
  children: (item: ItemType) => ReactNode;
}

interface UnSortable {
  sortable?: false;
}
interface Sortable<ItemType, SortByType extends SortByBase = SortByBase> {
  sortable: true;
  currentSort: SortByType;
  sortBy: SortByType[];
  onSortChange: (newSort: SortByType) => ItemType[] | Promise<ItemType[]>;
}

interface UnSelectable {
  selectable?: false;
}
type SelectionType = 'single' | 'multiple';
interface Selectable<ItemType> {
  selectable: true;
  type?: SelectionType;
  onSelectionChange: (newSelection: ItemType[]) => void;
}

interface UnPaginable {
  paginable?: false;
}
interface Paginable<ItemType> {
  paginable: true;
  currentPage?: number;
  numberOfItems: number;
  pageSize?: number;
  onPageChange: (newPage: number) => ItemType[] | Promise<ItemType[]>;
}

export const commonSortMessages = defineMessages({
  sortByAscendingCreationDate: {
    defaultMessage: 'Creation date',
    description: 'Sort table objects by ascending creation date',
    id: 'components.SortableTable.sortByAscendingCreationDate',
  },
  sortByDescendingCreationDate: {
    defaultMessage: 'Creation date (reversed)',
    description: 'Sort table objects by descending creation date',
    id: 'components.SortableTable.sortByDescendingCreationDate',
  },
  sortByAscendingTitle: {
    defaultMessage: 'Title',
    description: 'Sort table objects by ascending title.',
    id: 'components.SortableTable.sortByAscendingTitle',
  },
  sortByDescendingTitle: {
    defaultMessage: 'Title (reversed)',
    description: 'Sort table objects by descending title.',
    id: 'components.SortableTable.sortByDescendingTitle',
  },
});

type SortableTableProps<
  ItemType,
  SortByType extends SortByBase = SortByBase,
> = SortableTableBase<ItemType> &
  (UnSortable | Sortable<ItemType, SortByType>) &
  (Selectable<ItemType> | UnSelectable) &
  (Paginable<ItemType> | UnPaginable);

export const SortableTable = <
  ItemType,
  SortByType extends SortByBase = SortByBase,
>({
  title,
  loading: initialLoading,
  items: initialItems,
  children,
  ...props
}: SortableTableProps<ItemType, SortByType>) => {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<ItemType[]>([]);
  const [previousSelection, setPreviousSelection] = useState<ItemType[]>([]);
  const [currentSelection, setCurrentSelection] = useState<ItemType[]>([]);
  const [targetSort, setTargetSort] = useState<Maybe<SortByType>>(undefined);
  const [asyncLoader, setAsyncLoader] =
    useState<Maybe<() => Promise<ItemType[]>>>(undefined);

  let selectionCallback: Maybe<Selectable<ItemType>['onSelectionChange']> =
    undefined;
  let selectionType: Maybe<SelectionType> = undefined;
  if (props.selectable) {
    selectionCallback = props.onSelectionChange;
    selectionType = props.type || 'multiple';
  }

  let sortCallback: Maybe<Sortable<ItemType, SortByType>['onSortChange']> =
    undefined;
  let SortMenu: Maybe<JSX.Element>;
  if (props.sortable) {
    sortCallback = props.onSortChange;

    const sortItems = props.sortBy;
    const sortCurrentItem = props.currentSort;
    const availableItems = sortItems.filter((item) => {
      return item.label !== sortCurrentItem.label;
    });

    SortMenu = (
      <Menu
        secondary
        style={{ borderWidth: '0' }}
        a11yTitle="Sort item in the table"
        margin={{ left: 'auto', vertical: 'auto' }}
        label={sortCurrentItem.label}
        items={availableItems.map((item) => ({
          label: item.label,
          onClick: () => {
            setTargetSort(item);
          },
        }))}
      />
    );
  }

  useEffect(() => {
    if (Array.isArray(initialItems)) {
      setCurrentSelection([]);
      setIsLoading(false);
      setItems(initialItems);
      setAsyncLoader(undefined);
    } else {
      setAsyncLoader(() => initialItems);
    }
  }, [initialItems]);

  useEffect(() => {
    setIsLoading((current) => initialLoading || current);
  }, [initialLoading]);

  //  on selection change, call the callback if set
  useEffect(() => {
    const isChangesInSelection = !(
      currentSelection.length === previousSelection.length &&
      currentSelection.every((item) => previousSelection.includes(item))
    );
    if (!isChangesInSelection) {
      return;
    }

    setPreviousSelection(currentSelection);
    selectionCallback?.(currentSelection);
  }, [currentSelection, selectionCallback, previousSelection]);

  //  on sort change, call the callback and updates rows
  useEffect(() => {
    if (!targetSort || !sortCallback) {
      return;
    }
    const loader = sortCallback;

    setAsyncLoader(() => async () => await loader(targetSort));
  }, [targetSort, sortCallback]);

  //  async load item in the table
  useEffect(() => {
    if (!asyncLoader) {
      return;
    }

    let canceled = false;

    const loadItems = async () => {
      setCurrentSelection([]);
      setIsLoading(true);

      const newItems = await asyncLoader();

      if (canceled) {
        return;
      }
      setItems(newItems);
      setIsLoading(false);
    };

    loadItems();
    return () => {
      canceled = true;
    };
  }, [asyncLoader]);

  return (
    <Box direction="column" flex gap="small">
      <Box
        height={{ min: 'xxsmall' }}
        background="#E4EEFA"
        direction="row"
        key="headear"
        pad={{ left: 'medium' }}
        round={{ size: 'xsmall', corner: 'top' }}
      >
        {props.selectable && selectionType === 'multiple' && (
          <Box margin={{ right: 'large', vertical: 'auto' }}>
            <CheckBox
              a11yTitle={
                currentSelection.length === items.length
                  ? 'Deselect all lines'
                  : 'Select all lines'
              }
              disabled={isLoading}
              checked={currentSelection.length === items.length}
              onChange={() => {
                if (currentSelection.length === items.length) {
                  setCurrentSelection([]);
                } else {
                  setCurrentSelection(items);
                }
              }}
            />
          </Box>
        )}
        <Text color="blue-active" weight="normal" margin={{ vertical: 'auto' }}>
          {title}
        </Text>
        {SortMenu}
      </Box>
      <Stack guidingChild={items.length > 0 ? 'first' : 'last'}>
        <Fragment>
          {items.map((item, index) => (
            <Box
              key={`row_${index}`}
              background="#F2F7FD"
              direction="row"
              pad={{ horizontal: 'medium', vertical: 'small' }}
              round="xsmall"
              align="center"
              margin={index > 0 ? { top: 'xsmall' } : undefined}
            >
              {props.selectable && (
                <Box margin={{ right: 'large' }}>
                  {selectionType === 'multiple' && (
                    <CheckBox
                      a11yTitle={
                        currentSelection.includes(item)
                          ? `Deselect line ${index + 1}`
                          : `Select line ${index + 1}`
                      }
                      checked={currentSelection.includes(item)}
                      onChange={() => {
                        if (currentSelection.includes(item)) {
                          setCurrentSelection(
                            currentSelection.filter((t) => t !== item),
                          );
                        } else {
                          setCurrentSelection([...currentSelection, item]);
                        }
                      }}
                    />
                  )}
                  {selectionType === 'single' && (
                    <RadioButton
                      a11yTitle={`Select line ${index + 1}`}
                      name={`line ${index}`}
                      checked={currentSelection.includes(item)}
                      onChange={() => {
                        setCurrentSelection([item]);
                      }}
                    />
                  )}
                </Box>
              )}
              <Box flex>{children(item)}</Box>
            </Box>
          ))}
        </Fragment>

        {isLoading && (
          <Box fill height={{ min: '60px' }}>
            <Box margin="auto">
              <Spinner />
            </Box>
          </Box>
        )}
      </Stack>

      {props.paginable && (
        <Box direction="row" flex key="footer">
          <Box flex="shrink" margin="auto">
            <Pagination
              numberItems={props.numberOfItems}
              onChange={({ page: newPage }: { page: number }) => {
                setAsyncLoader(
                  () => async () => await props.onPageChange(newPage),
                );
              }}
              page={props.currentPage}
              step={props.pageSize}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

import { ListExtendedProps, List as ListInit } from 'grommet';

// @see https://github.com/grommet/grommet/issues/6836
type TListFixed = <ListItemType = string | unknown>(
  p: ListExtendedProps<ListItemType>,
) => React.ReactElement<ListExtendedProps<ListItemType>>;

export const List = ListInit as TListFixed;

import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { Box } from '..';

import { ItemList } from '.';

const NO_ITEM_MSG = "There aren't any item to display";
const RENDER_FCT = (item: string, index: string) => (
  <Box key={index}>{item}</Box>
);
describe('<ItemList />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders items', () => {
    render(
      <ItemList itemList={['a', 'b', 'c']} noItemsMessage={NO_ITEM_MSG}>
        {RENDER_FCT}
      </ItemList>,
    );
    screen.getByText('a');
    screen.getByText('b');
    screen.getByText('c');

    expect(screen.queryByText(NO_ITEM_MSG)).toBe(null);
  });

  it('renders the no items message', () => {
    render(
      <ItemList itemList={[]} noItemsMessage={NO_ITEM_MSG}>
        {RENDER_FCT}
      </ItemList>,
    );
    expect(screen.queryByText('a')).toBe(null);
    expect(screen.queryByText('b')).toBe(null);
    expect(screen.queryByText('c')).toBe(null);

    screen.getByText(NO_ITEM_MSG);
  });
});

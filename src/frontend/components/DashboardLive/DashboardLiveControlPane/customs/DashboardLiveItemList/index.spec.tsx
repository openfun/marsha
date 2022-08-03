import { screen } from '@testing-library/react';
import { Box } from 'grommet';
import React from 'react';

import render from 'utils/tests/render';

import { DashboardLiveItemList } from '.';

const NO_ITEM_MSG = "There aren't any item to display";
const RENDER_FCT = (item: string, index: string) => (
  <Box key={index}>{item}</Box>
);
describe('<DashboardLiveItemList />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders items', () => {
    render(
      <DashboardLiveItemList
        itemList={['a', 'b', 'c']}
        noItemsMessage={NO_ITEM_MSG}
      >
        {RENDER_FCT}
      </DashboardLiveItemList>,
    );
    screen.getByText('a');
    screen.getByText('b');
    screen.getByText('c');

    expect(screen.queryByText(NO_ITEM_MSG)).toBe(null);
  });

  it('renders the no items message', () => {
    render(
      <DashboardLiveItemList itemList={[]} noItemsMessage={NO_ITEM_MSG}>
        {RENDER_FCT}
      </DashboardLiveItemList>,
    );
    expect(screen.queryByText('a')).toBe(null);
    expect(screen.queryByText('b')).toBe(null);
    expect(screen.queryByText('c')).toBe(null);

    screen.getByText(NO_ITEM_MSG);
  });
});

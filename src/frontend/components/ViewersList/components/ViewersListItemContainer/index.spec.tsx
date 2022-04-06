import { render, screen } from '@testing-library/react';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import renderer from 'react-test-renderer';

import { theme } from 'utils/theme/theme';
import { ViewersListItemContainer } from '.';

const GenericChild = () => <p>Some text</p>;

describe('<ViewersListItemContainer />', () => {
  it('renders ViewersListItemContainer, with a child', () => {
    render(
      <ViewersListItemContainer>
        <GenericChild />
      </ViewersListItemContainer>,
    );
    screen.getByText('Some text');
  });

  it('checks hover style is applied', async () => {
    const tree = renderer
      .create(
        <ViewersListItemContainer>
          <GenericChild />
        </ViewersListItemContainer>,
      )
      .toJSON();

    expect(tree).toHaveStyleRule(
      'background',
      normalizeColor('bg-marsha', theme),
      {
        modifier: ':hover',
      },
    );
  });
});

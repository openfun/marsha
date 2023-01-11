import { screen } from '@testing-library/react';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import { render } from 'lib-tests';
import React from 'react';
import renderer from 'react-test-renderer';

import { ViewersListItemContainer } from '.';

const GenericChild = () => <p>Some text</p>;

describe('<ViewersListItemContainer />', () => {
  it('renders ViewersListItemContainer, with a child', () => {
    render(
      <ViewersListItemContainer>
        <GenericChild />
      </ViewersListItemContainer>,
    );

    expect(screen.getByText('Some text')).toBeInTheDocument();
  });

  it('checks hover style is applied', () => {
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

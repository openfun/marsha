import { screen } from '@testing-library/react';
import React from 'react';

import render from 'utils/tests/render';
import { WhiteCard } from '.';

describe('', () => {
  it('renders title and content on small display', () => {
    render(
      <WhiteCard title="some title">
        <p>some content</p>
      </WhiteCard>,
      { grommetOptions: { responsiveSize: 'small' } },
    );

    screen.getByText('some title');
    screen.getByText('some content');
  });

  it('renders title and content', () => {
    render(
      <WhiteCard title="some title">
        <p>some content</p>
      </WhiteCard>,
      { grommetOptions: { responsiveSize: 'medium' } },
    );

    screen.getByText('some title');
    screen.getByText('some content');
  });
});

import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { WhiteCard } from '.';

describe('<WhiteCard />', () => {
  it('renders title and content on small display', () => {
    render(
      <WhiteCard title="some title">
        <p>some content</p>
      </WhiteCard>,
      { grommetOptions: { responsiveSize: 'small' } },
    );

    expect(screen.getByText('some title')).toBeInTheDocument();
    expect(screen.getByText('some content')).toBeInTheDocument();
  });

  it('renders title and content', () => {
    render(
      <WhiteCard title="some title">
        <p>some content</p>
      </WhiteCard>,
      { grommetOptions: { responsiveSize: 'medium' } },
    );

    expect(screen.getByText('some title')).toBeInTheDocument();
    expect(screen.getByText('some content')).toBeInTheDocument();
  });
});

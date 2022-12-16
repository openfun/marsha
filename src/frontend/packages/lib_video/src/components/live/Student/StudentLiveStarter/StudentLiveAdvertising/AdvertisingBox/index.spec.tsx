import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { AdvertisingBox } from '.';

describe('<AdvertisingBox />', () => {
  it('renders properly', () => {
    const child = <h2>content</h2>;

    render(<AdvertisingBox>{child}</AdvertisingBox>);

    expect(
      screen.getByRole('heading', { name: 'content' }),
    ).toBeInTheDocument();
  });
});

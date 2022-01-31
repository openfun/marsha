import { render, screen } from '@testing-library/react';
import React from 'react';

import { AdvertisingBox } from '.';

describe('<AdvertisingBox />', () => {
  it('renders properly', () => {
    const child = <h2>content</h2>;

    render(<AdvertisingBox>{child}</AdvertisingBox>);

    screen.getByRole('heading', { name: 'content' });
  });
});

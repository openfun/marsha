import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import HomePage from './HomePage';

describe('<HomePage />', () => {
  test('renders HomePage', () => {
    render(<HomePage />);
    expect(screen.getByText(/Homepage/i)).toBeInTheDocument();
  });
});

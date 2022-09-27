import { render, screen } from '@testing-library/react';
import React from 'react';

import Favorites from './Favorites';

describe('<Favorites />', () => {
  test('renders Favorites', () => {
    render(<Favorites />);
    expect(screen.getByText(/My favorites/i)).toBeInTheDocument();
  });
});

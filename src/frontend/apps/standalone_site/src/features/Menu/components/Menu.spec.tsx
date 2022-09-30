import { render, screen } from '@testing-library/react';
import React from 'react';

import Menu from './Menu';

describe('<Menu />', () => {
  test('renders Menu', () => {
    render(<Menu />);
    expect(
      screen.getByRole(/menuitem/i, { name: /Favorites/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole(/menuitem/i, { name: /My Contents/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole(/menuitem/i, { name: /Vidéos/i }),
    ).toBeInTheDocument();
  });
});

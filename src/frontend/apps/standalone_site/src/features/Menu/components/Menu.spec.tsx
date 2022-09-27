import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import Menu from './Menu';

describe('<Menu />', () => {
  test('renders Menu', () => {
    render(<Menu />, {
      wrapper: BrowserRouter,
    });
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

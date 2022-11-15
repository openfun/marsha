import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';

import Burger from './Burger';

describe('<Burger />', () => {
  test('renders Burger', () => {
    render(<Burger />);
    expect(screen.getByRole(/button/i)).toBeInTheDocument();
  });

  test('Burger interaction', () => {
    render(<Burger />);

    const burger = screen.getByRole(/button/i);
    expect(burger).toBeInTheDocument();
    expect(burger.classList.contains('open')).toBeTruthy();
    fireEvent.click(burger);
    expect(burger.classList.contains('open')).not.toBeTruthy();
  });
});

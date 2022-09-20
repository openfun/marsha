import React from 'react';
import Menu from './Menu';
import { render, screen } from '@testing-library/react';

describe('<Menu />', () => {
  test('renders Menu', () => {
    render(<Menu />);
    expect(screen.getByText(/My first menu/i)).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import React from 'react';
import HomePage from './HomePage';

describe('<HomePage />', () => {
  test('renders HomePage', () => {
    render(<HomePage />);
    expect(screen.getByText(/HomePage/i)).toBeInTheDocument();
  });
});

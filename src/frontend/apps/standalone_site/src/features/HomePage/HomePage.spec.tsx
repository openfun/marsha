import React from 'react';
import HomePage from './HomePage';
import { render, screen } from '@testing-library/react';

describe('<HomePage />', () => {
  test('renders HomePage', () => {
    render(<HomePage />);
    expect(screen.getByText(/HomePage/i)).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import React from 'react';
import Header from './Header';

describe('<Header />', () => {
  test('renders Header', () => {
    render(<Header />);
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  });
});

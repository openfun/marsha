import React from 'react';
import Header from './Header';
import { render, screen } from '@testing-library/react';

describe('<Header />', () => {
  test('renders Header', () => {
    render(<Header />);
    expect(screen.getByText(/My first header/i)).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import React from 'react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  expect(
    screen.getByRole(/menuitem/i, { name: /Favorites/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/My first header/i)).toBeInTheDocument();
  expect(screen.getByText(/HomePage/i)).toBeInTheDocument();
});

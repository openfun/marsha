import { render, screen } from '@testing-library/react';
import React from 'react';
import Card from './Card';

describe('<Card />', () => {
  test('renders Card', () => {
    render(<Card image="/my-nice-image.jpg" title="This is a nice image." />);

    const image = screen.getByAltText(/Image about This is a nice image./i);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/my-nice-image.jpg');
    expect(screen.getByText(/This is a nice image./i)).toBeInTheDocument();
  });
});

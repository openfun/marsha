import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { BoxLoader } from './BoxLoader';

describe(`<BoxLoader />`, () => {
  it('renders a loader', () => {
    render(<BoxLoader />);

    expect(screen.getByRole('status')).toHaveClass('c__loader');
    expect(screen.getByLabelText('loader')).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });

  it('renders a loader with white background', () => {
    render(<BoxLoader whiteBackground />);

    expect(screen.getByLabelText('loader')).toHaveStyle({
      background: 'white',
    });
  });

  it('renders a loader with small size', () => {
    render(<BoxLoader size="small" />);

    expect(screen.getByRole('status')).toHaveClass('c__loader--small');
  });

  it('renders a loader with boxProps', () => {
    render(
      <BoxLoader
        boxProps={{
          margin: '555px',
        }}
      />,
    );

    expect(screen.getByLabelText('loader')).toHaveStyle({ margin: '555px' });
  });

  it('renders a loader with aria-label', () => {
    render(<BoxLoader aria-label="My aria label" />);

    expect(screen.getByLabelText('My aria label')).toBeInTheDocument();
  });
});

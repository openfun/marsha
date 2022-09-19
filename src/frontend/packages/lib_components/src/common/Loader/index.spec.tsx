import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { Loader, Spinner } from '.';

for (const Component of [Spinner, Loader]) {
  describe(`<${Component.name} />`, () => {
    it('renders a spinner as an accessible status region', () => {
      render(
        <Component>
          <span>Loading some object...</span>
        </Component>,
      );

      const region = screen.getByRole('status', {
        name: 'Loading some object...',
      });
      expect(region).toHaveAttribute('aria-live', 'polite');
    });

    it('renders a spinner as an accessible alert region', () => {
      render(
        <Component role="alert">
          <span>Loading some important object...</span>
        </Component>,
      );

      const region = screen.getByRole('alert', {
        name: 'Loading some important object...',
      });
      expect(region).toHaveAttribute('aria-live', 'assertive');
    });

    it('renders a spinner that is hidden from the accessibility tree', () => {
      render(<Component aria-hidden={true} />);
      expect(screen.queryByRole('status')).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });
}

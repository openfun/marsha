import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { FormHelpText } from '.';

describe('<FormHelpText />', () => {
  it('displays correctly', () => {
    render(<FormHelpText>My text</FormHelpText>);
    expect(screen.getByText('My text')).not.toHaveClass('clr-greyscale-400');
  });

  it('displays correctly with disabled props', () => {
    render(<FormHelpText disabled>My text</FormHelpText>);
    expect(screen.getByText('My text')).toHaveClass('clr-greyscale-400');
  });
});

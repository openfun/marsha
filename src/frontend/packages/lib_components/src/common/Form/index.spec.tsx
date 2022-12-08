import { screen } from '@testing-library/react';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import { render } from 'lib-tests';
import React from 'react';

import { FormHelpText } from '.';

describe('<FormHelpText />', () => {
  it('displays correctly', () => {
    render(<FormHelpText>My text</FormHelpText>);
    expect(screen.getByText('My text')).toHaveStyle({
      color: normalizeColor('blue-active', theme),
    });
  });

  it('displays correctly with disabled props', () => {
    render(<FormHelpText disabled>My text</FormHelpText>);
    expect(screen.getByText('My text')).toHaveStyle({
      color: normalizeColor('bg-grey', theme),
    });
  });
});

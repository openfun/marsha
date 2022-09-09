import { screen } from '@testing-library/react';
import { normalizeColor } from 'grommet/utils';
import React from 'react';

import render from 'utils/tests/render';
import { theme } from 'lib-common';
import { ProgressionBar } from '.';

describe('<ProgressionBar />', () => {
  it('renders ProgressionBar with a percentage < 45', () => {
    render(<ProgressionBar progressPercentage={25} />);
    const text = screen.getByText('25 %');
    expect(text).toHaveStyle(`color: ${normalizeColor('blue-active', theme)}`);
  });

  it('renders ProgressionBar with a percentage > 45', () => {
    render(<ProgressionBar progressPercentage={75} />);
    const text = screen.getByText('75 %');
    expect(text).toHaveStyle(`color: ${normalizeColor('white', theme)}`);
  });
});

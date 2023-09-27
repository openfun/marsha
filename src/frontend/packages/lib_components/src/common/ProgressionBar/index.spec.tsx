import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { ProgressionBar } from '.';

describe('<ProgressionBar />', () => {
  it('renders ProgressionBar with a percentage < 45', () => {
    render(<ProgressionBar progressPercentage={25} />);
    const text = screen.getByText('25 %');
    expect(text).toHaveStyle(`color: undefined`);
  });

  it('renders ProgressionBar with a percentage > 45', () => {
    render(<ProgressionBar progressPercentage={75} />);
    const text = screen.getByText('75 %');
    expect(text).toHaveStyle(`color: white`);
  });
});

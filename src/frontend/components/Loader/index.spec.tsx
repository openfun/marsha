import { render } from '@testing-library/react';
import React from 'react';

import { Loader } from '.';

describe('<Loader />', () => {
  it('renders', () => {
    const { container } = render(<Loader />);

    const divSelector = container.querySelector('div[aria-busy]')!;
    expect(divSelector.getAttribute('aria-busy')).toEqual('true');
    expect(divSelector.getAttribute('aria-live')).toEqual('polite');
  });
});

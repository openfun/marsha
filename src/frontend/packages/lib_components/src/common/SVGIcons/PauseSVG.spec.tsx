/* eslint-disable jest/expect-expect */
import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { PauseSVG } from './PauseSVG';

describe('<PauseSVG />', () => {
  it('renders PauseSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<PauseSVG iconColor="blue-focus" />);
  });
});

/* eslint-disable jest/expect-expect */
import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { StopSVG } from './StopSVG';

describe('<StopSVG />', () => {
  it('renders StopSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<StopSVG iconColor="blue-focus" />);
  });
});

import React from 'react';
import { renderIconSnapshot } from 'lib-tests';

import { PauseSVG } from './PauseSVG';

describe('<PauseSVG />', () => {
  it('renders PauseSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<PauseSVG iconColor="blue-focus" />);
  });
});

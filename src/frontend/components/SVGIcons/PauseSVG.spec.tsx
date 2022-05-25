import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { PauseSVG } from './PauseSVG';

describe('<PauseSVG />', () => {
  it('renders PauseSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<PauseSVG iconColor="blue-focus" />);
  });
});

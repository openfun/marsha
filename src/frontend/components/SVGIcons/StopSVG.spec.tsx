import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { StopSVG } from './StopSVG';

describe('<StopSVG />', () => {
  it('renders StopSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<StopSVG iconColor="blue-focus" />);
  });
});

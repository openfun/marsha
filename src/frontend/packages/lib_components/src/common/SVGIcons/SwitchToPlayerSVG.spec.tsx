/* eslint-disable jest/expect-expect */
import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { SwitchToPlayerSVG } from './SwitchToPlayerSVG';

describe('<SwitchToPlayerSVG />', () => {
  it('renders SwitchToPlayerSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<SwitchToPlayerSVG iconColor="#035ccd" />);
  });
});

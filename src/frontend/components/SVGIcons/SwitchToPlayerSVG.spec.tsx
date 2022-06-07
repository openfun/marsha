import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { SwitchToPlayerSVG } from './SwitchToPlayerSVG';

describe('<SwitchToPlayerSVG />', () => {
  it('renders SwitchToPlayerSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<SwitchToPlayerSVG iconColor="#035ccd" />);
  });
});

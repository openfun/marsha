import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { AppsSVG } from './AppsSVG';

it('renders AppsSVG correctly', async () => {
  await renderIconSnapshot(<AppsSVG iconColor="#035ccd" />);
});

import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { ViewersSVG } from './ViewersSVG';

it('renders ViewersSVG correctly', async () => {
  await renderIconSnapshot(<ViewersSVG iconColor="#035ccd" />);
});

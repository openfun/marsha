import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { ChatSVG } from './ChatSVG';

it('renders ChatSVG correctly', async () => {
  await renderIconSnapshot(<ChatSVG iconColor="#035ccd" />);
});

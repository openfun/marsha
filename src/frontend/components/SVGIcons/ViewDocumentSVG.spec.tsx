import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { ViewDocumentSVG } from './ViewDocumentSVG';

it('renders ViewDocumentSVG correctly', async () => {
  await renderIconSnapshot(<ViewDocumentSVG iconColor="#035ccd" />);
});

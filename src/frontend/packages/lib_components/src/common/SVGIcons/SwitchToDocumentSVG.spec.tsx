import React from 'react';
import { renderIconSnapshot } from 'lib-tests';

import { SwitchToDocumentSVG } from './SwitchToDocumentSVG';

describe('<SwitchToDocumentSVG />', () => {
  it('renders SwitchToDocumentSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<SwitchToDocumentSVG iconColor="#035ccd" />);
  });
});

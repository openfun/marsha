/* eslint-disable jest/expect-expect */
import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { SwitchToDocumentSVG } from './SwitchToDocumentSVG';

describe('<SwitchToDocumentSVG />', () => {
  it('renders SwitchToDocumentSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<SwitchToDocumentSVG iconColor="#035ccd" />);
  });
});

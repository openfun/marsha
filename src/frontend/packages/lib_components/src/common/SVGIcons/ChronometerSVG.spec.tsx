import React from 'react';
import { renderIconSnapshot } from 'lib-tests';

import { ChronometerSVG } from './ChronometerSVG';

describe('<ChronometerSVG />', () => {
  it('renders ChronometerSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<ChronometerSVG iconColor="#035ccd" />);
  });
});

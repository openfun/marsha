/* eslint-disable jest/expect-expect */
import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { ChronometerSVG } from './ChronometerSVG';

describe('<ChronometerSVG />', () => {
  it('renders ChronometerSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<ChronometerSVG iconColor="#035ccd" />);
  });
});

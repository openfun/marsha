/* eslint-disable jest/expect-expect */
import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { DownArrowSVG } from './DownArrowSVG';

describe('<DownArrowSVG />', () => {
  it('renders DownArrowSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <DownArrowSVG
        containerStyle={{
          height: '7px',
          width: '12px',
        }}
        iconColor="blue-focus"
      />,
    );
  });
});

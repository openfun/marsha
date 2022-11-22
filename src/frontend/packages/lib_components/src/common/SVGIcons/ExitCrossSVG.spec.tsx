/* eslint-disable jest/expect-expect */
import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { ExitCrossSVG } from './ExitCrossSVG';

describe('<ExitCrossSVG />', () => {
  it('renders ExitCrossSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <ExitCrossSVG
        containerStyle={{
          height: '20px',
          width: '20px',
        }}
        iconColor="blue-focus"
      />,
    );
  });
});

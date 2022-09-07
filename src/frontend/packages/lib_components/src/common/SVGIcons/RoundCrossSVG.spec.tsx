import React from 'react';
import { renderIconSnapshot } from 'lib-tests';

import { RoundCrossSVG } from './RoundCrossSVG';

describe('<RoundCrossSVG />', () => {
  it('renders InfoCircleSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <RoundCrossSVG
        containerStyle={{
          height: '20px',
          width: '20px',
        }}
        iconColor="blue-focus"
      />,
    );
  });
});

import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { RoundCrossSVG } from './RoundCrossSVG';

describe('<RoundCrossSVG />', () => {
  it('renders InfoCircleSVG correctly', async () => {
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

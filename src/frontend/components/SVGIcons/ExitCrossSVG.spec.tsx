import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { ExitCrossSVG } from './ExitCrossSVG';

it('renders ExitCrossSVG correctly', async () => {
  await renderIconSnapshot(
    <ExitCrossSVG
      containerStyle={{
        height: '20px',
        width: '20px',
      }}
      iconColor="#031963"
    />,
  );
});

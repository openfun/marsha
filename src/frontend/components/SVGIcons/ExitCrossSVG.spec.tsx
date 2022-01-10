import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { ExitCrossSVG } from './ExitCrossSVG';

describe('<ExitCrossSVG />', () => {
  it('renders ExitCrossSVG correctly', async () => {
    await renderIconSnapshot(
      <ExitCrossSVG height={20} width={20} iconColor="#031963" />,
    );
  });
});

import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { CopySVG } from './CopySVG';

describe('<CopySVG />', () => {
  it('renders CopySVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <CopySVG
        containerStyle={{
          height: '25px',
          width: '20px',
        }}
        iconColor="blue-active"
      />,
    );
  });
});

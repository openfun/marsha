import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { BinSVG } from './BinSVG';

describe('<BinSVG />', () => {
  it('renders BinSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <BinSVG
        containerStyle={{
          height: '14px',
          width: '18px',
        }}
        iconColor="blue-active"
      />,
    );
  });
});

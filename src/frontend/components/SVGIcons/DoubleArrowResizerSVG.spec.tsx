import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { DoubleArrowResizerSVG } from './DoubleArrowResizerSVG';

describe('<DoubleArrowResizerSVG />', () => {
  it('renders DoubleArrowResizerSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <DoubleArrowResizerSVG
        containerStyle={{
          height: '28px',
          width: '28px',
        }}
        iconColor="blue-focus"
      />,
    );
  });
});

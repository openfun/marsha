import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { DownArrowSVG } from './DownArrowSVG';

describe('<DownArrowSVG />', () => {
  it('renders DownArrowSVG correctly', async () => {
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

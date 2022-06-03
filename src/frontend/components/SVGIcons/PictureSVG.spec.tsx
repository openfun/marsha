import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { PictureSVG } from './PictureSVG';

describe('PictureSVG', () => {
  it('renders PictureSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <PictureSVG
        containerStyle={{
          height: '18px',
          width: '18px',
        }}
        iconColor="blue-focus"
      />,
    );
  });
});

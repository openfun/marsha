import React from 'react';
import { renderIconSnapshot } from 'lib-tests';

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

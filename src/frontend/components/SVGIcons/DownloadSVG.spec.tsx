import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { DownloadSVG } from './DownloadSVG';

describe('DownloadSVG', () => {
  it('renders DownloadSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <DownloadSVG
        containerStyle={{
          height: '7px',
          width: '12px',
        }}
        iconColor="blue-focus"
      />,
    );
  });
});

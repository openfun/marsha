import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { DownloadSVG } from './DownloadSVG';

describe('<DownloadSVG />', () => {
  it('renders DownloadSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <DownloadSVG
        containerStyle={{
          height: '24px',
          width: '24px',
        }}
        iconColor="blue-active"
      />,
    );
  });
});

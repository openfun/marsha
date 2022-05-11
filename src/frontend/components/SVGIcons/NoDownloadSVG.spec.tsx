import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { NoDownloadSVG } from './NoDownloadSVG';

describe('<NoDownloadSVG />', () => {
  it('renders NoDownloadSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <NoDownloadSVG
        containerStyle={{
          height: '24px',
          width: '24px',
        }}
        iconColor="blue-off"
      />,
    );
  });
});

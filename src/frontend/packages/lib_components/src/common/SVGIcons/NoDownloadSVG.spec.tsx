/* eslint-disable jest/expect-expect */
import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

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

/* eslint-disable jest/expect-expect */
import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { CameraOnSVG } from './CameraOnSVG';

describe('<CameraOnSVG />', () => {
  it('renders svg [screenshot]', async () => {
    await renderIconSnapshot(
      <CameraOnSVG
        containerStyle={{
          height: '14px',
          width: '18px',
        }}
        iconColor="blue-active"
      />,
    );
  });
});

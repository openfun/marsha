import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { CameraOffSVG } from './CameraOffSVG';

describe('<CameraOffSVG />', () => {
  it('renders svg [screenshot]', async () => {
    await renderIconSnapshot(
      <CameraOffSVG
        containerStyle={{
          height: '14px',
          width: '18px',
        }}
        iconColor="blue-active"
      />,
    );
  });
});

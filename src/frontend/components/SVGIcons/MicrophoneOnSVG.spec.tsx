import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { MicrophoneOnSVG } from './MicrophoneOnSVG';

describe('<MicrophoneOnSVG />', () => {
  it('renders svg [screenshot]', async () => {
    await renderIconSnapshot(
      <MicrophoneOnSVG
        containerStyle={{
          height: '14px',
          width: '18px',
        }}
        iconColor="blue-active"
      />,
    );
  });
});

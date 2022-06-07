import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { MicrophoneOffSVG } from './MicrophoneOffSVG';

describe('<MicrophoneOffSVG />', () => {
  it('renders svg [screenshot]', async () => {
    await renderIconSnapshot(
      <MicrophoneOffSVG
        containerStyle={{
          height: '14px',
          width: '18px',
        }}
        iconColor="blue-active"
      />,
    );
  });
});

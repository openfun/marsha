/* eslint-disable jest/expect-expect */
import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

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

import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { RingingBellSVG } from './RingingBellSVG';

describe('<RingingBellSVG />', () => {
  it('renders RingingBellSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <RingingBellSVG
        containerStyle={{
          height: '20px',
          width: '21px',
        }}
        iconColor="blue-active"
      />,
    );
  });
});

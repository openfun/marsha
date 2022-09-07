import React from 'react';
import { renderIconSnapshot } from 'lib-tests';

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

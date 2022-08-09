import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { RoundPlusSVG } from './RoundPlusSVG';

describe('<RoundPlusSVG />', () => {
  it('renders RoundPlus correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <RoundPlusSVG
        containerStyle={{
          height: '20px',
          width: '20px',
        }}
        iconColor="blue-focus"
      />,
    );
  });
});

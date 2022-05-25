import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { InfoCircleSVG } from './InfoCircleSVG';

describe('<InfoCircleSVG />', () => {
  it('renders InfoCircleSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <InfoCircleSVG
        containerStyle={{
          height: '20px',
          width: '20px',
        }}
        iconColor="blue-focus"
      />,
    );
  });
});

import React from 'react';
import { renderIconSnapshot } from 'lib-tests';

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

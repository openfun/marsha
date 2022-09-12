import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { MoreOptionSVG } from './MoreOptionSVG';

describe('<MoreOptionSVG />', () => {
  it('renders svg [screenshot]', async () => {
    await renderIconSnapshot(
      <MoreOptionSVG
        containerStyle={{
          height: '14px',
          width: '18px',
        }}
        iconColor="blue-active"
      />,
    );
  });
});

import React from 'react';
import { renderIconSnapshot } from 'lib-tests';

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

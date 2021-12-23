import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { SendButtonSVG } from './SendButtonSVG';

it('renders SendButtonSVG correctly', async () => {
  await renderIconSnapshot(
    <SendButtonSVG
      iconColor="blue-chat"
      containerStyle={{
        width: '25px',
        height: '22px',
      }}
    />,
  );
});

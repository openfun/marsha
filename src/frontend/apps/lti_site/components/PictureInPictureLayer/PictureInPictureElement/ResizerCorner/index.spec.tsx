import React from 'react';

import { renderImageSnapshot } from 'utils/tests/imageSnapshot';

import { ResizerCorner } from '.';

describe('<ResizerCorner />', () => {
  it('renders the content [screenshot]', async () => {
    await renderImageSnapshot(
      <ResizerCorner style={{ marginBottom: '0px', marginRight: '0px' }} />,
      100,
      100,
    );
  });
});

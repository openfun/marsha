/* eslint-disable jest/expect-expect */
import { renderImageSnapshot } from 'lib-tests';
import React from 'react';

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

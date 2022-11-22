/* eslint-disable jest/expect-expect */
import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { ViewersSVG } from './ViewersSVG';

describe('<ViewersSVG />', () => {
  it('renders ViewersSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<ViewersSVG iconColor="#035ccd" />);
  });

  it('renders ViewersSVG focus [screenshot]', async () => {
    await renderIconSnapshot(
      <ViewersSVG iconColor="white" focusColor="#035ccd" />,
    );
  });
});

import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

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

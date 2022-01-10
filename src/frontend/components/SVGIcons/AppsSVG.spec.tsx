import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { AppsSVG } from './AppsSVG';

describe('<AppsSVG />', () => {
  it('renders AppsSVG correctly', async () => {
    await renderIconSnapshot(<AppsSVG iconColor="#035ccd" />);
  });

  it('renders AppsSVG focus', async () => {
    await renderIconSnapshot(
      <AppsSVG iconColor="white" focusColor="blue-focus" />,
    );
  });
});

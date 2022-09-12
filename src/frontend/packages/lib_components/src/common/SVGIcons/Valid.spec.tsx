import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { ValidSVG } from './ValidSVG';

describe('<ValidSVG />', () => {
  it('renders ValidSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<ValidSVG iconColor="#035ccd" />);
  });

  it('renders ValidSVG focus [screenshot]', async () => {
    await renderIconSnapshot(
      <ValidSVG iconColor="white" focusColor="#035ccd" />,
    );
  });
});

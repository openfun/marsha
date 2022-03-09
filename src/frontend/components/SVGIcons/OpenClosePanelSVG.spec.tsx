import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { OpenClosePanelSVG } from './OpenClosePanelSVG';

describe('<OpenClosePanelSVG />', () => {
  it('renders OpenClosePanelSVG correctly', async () => {
    await renderIconSnapshot(
      <OpenClosePanelSVG
        containerStyle={{
          height: '20px',
          width: '20px',
        }}
        iconColor="white"
      />,
    );
  });
});

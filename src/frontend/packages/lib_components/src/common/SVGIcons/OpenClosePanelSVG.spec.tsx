import React from 'react';
import { renderIconSnapshot } from 'lib-tests';

import { OpenClosePanelSVG } from './OpenClosePanelSVG';

describe('<OpenClosePanelSVG />', () => {
  it('renders OpenClosePanelSVG correctly [screenshot]', async () => {
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

import { normalizeColor } from 'grommet/utils';
import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { theme } from 'utils/theme/theme';

import { ChronometerSVG } from './ChronometerSVG';

describe('<ChronometerSVG />', () => {
  it('renders ChronometerSVG correctly', async () => {
    await renderIconSnapshot(
      <ChronometerSVG iconColor={normalizeColor('blue-active', theme)} />,
    );
  });
});

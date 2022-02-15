import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { PlaySVG } from './PlaySVG';

describe('<PlaySVG />', () => {
  it('renders PlaySVG correctly', async () => {
    await renderIconSnapshot(<PlaySVG iconColor="blue-focus" />);
  });
});

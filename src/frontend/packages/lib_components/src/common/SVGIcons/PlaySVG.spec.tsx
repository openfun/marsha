import React from 'react';
import { renderIconSnapshot } from 'lib-tests';

import { PlaySVG } from './PlaySVG';

describe('<PlaySVG />', () => {
  it('renders PlaySVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<PlaySVG iconColor="blue-focus" />);
  });
});

import React from 'react';
import { renderIconSnapshot } from 'lib-tests';

import { RecordSVG } from './RecordSVG';

describe('<RecordSVG />', () => {
  it('renders RecordSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <RecordSVG
        containerStyle={{
          height: '100%',
          width: '100%',
        }}
        iconColor="blue-focus"
      />,
    );
  });
});

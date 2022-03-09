import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { RecordSVG } from './RecordSVG';

describe('<RecordSVG />', () => {
  it('renders RecordSVG correctly', async () => {
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

import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { ChatSVG } from './ChatSVG';

describe('<ChatSVG />', () => {
  it('renders ChatSVG correctly', async () => {
    await renderIconSnapshot(<ChatSVG iconColor="#035ccd" />);
  });

  it('renders ChatSVG focus', async () => {
    await renderIconSnapshot(
      <ChatSVG iconColor="white" focusColor="#035ccd" />,
    );
  });
});

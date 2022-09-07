import React from 'react';
import { renderIconSnapshot } from 'lib-tests';

import { ChatSVG } from './ChatSVG';

describe('<ChatSVG />', () => {
  it('renders ChatSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<ChatSVG iconColor="#035ccd" />);
  });

  it('renders ChatSVG focus [screenshot]', async () => {
    await renderIconSnapshot(
      <ChatSVG iconColor="white" focusColor="#035ccd" />,
    );
  });
});

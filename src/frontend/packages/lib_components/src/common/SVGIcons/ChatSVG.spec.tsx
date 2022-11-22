/* eslint-disable jest/expect-expect */
import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

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

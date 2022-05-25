import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { SendButtonSVG } from './SendButtonSVG';

describe('<SendButtonSVG />', () => {
  it('renders SendButtonSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <SendButtonSVG height={22} width={25} iconColor="blue-chat" />,
    );
  });
});

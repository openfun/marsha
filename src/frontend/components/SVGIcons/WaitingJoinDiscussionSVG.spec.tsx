import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { WaitingJoinDiscussionSVG } from './WaitingJoinDiscussionSVG';

it('renders WaitingJoinDiscussionSVG correctly', async () => {
  await renderIconSnapshot(<WaitingJoinDiscussionSVG iconColor="#035ccd" />);
});

import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { JoinDiscussionSVG } from './JoinDiscussionSVG';

it('renders JoinDiscussionSVG correctly', async () => {
  await renderIconSnapshot(<JoinDiscussionSVG iconColor="#035ccd" />);
});

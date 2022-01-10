import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { JoinDiscussionSVG } from './JoinDiscussionSVG';

describe('<JoinDiscussionSVG />', () => {
  it('renders JoinDiscussionSVG correctly', async () => {
    await renderIconSnapshot(<JoinDiscussionSVG iconColor="#035ccd" />);
  });

  it('renders JoinDiscussionSVG focus', async () => {
    await renderIconSnapshot(
      <JoinDiscussionSVG iconColor="white" focusColor="#035ccd" />,
    );
  });
});

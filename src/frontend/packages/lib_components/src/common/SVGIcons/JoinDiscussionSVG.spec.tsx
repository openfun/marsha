/* eslint-disable jest/expect-expect */
import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

import { JoinDiscussionSVG } from './JoinDiscussionSVG';

describe('<JoinDiscussionSVG />', () => {
  it('renders JoinDiscussionSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<JoinDiscussionSVG iconColor="#035ccd" />);
  });

  it('renders JoinDiscussionSVG focus [screenshot]', async () => {
    await renderIconSnapshot(
      <JoinDiscussionSVG iconColor="white" focusColor="#035ccd" />,
    );
  });
});

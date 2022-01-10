import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { WaitingJoinDiscussionSVG } from './WaitingJoinDiscussionSVG';

describe('<WaitingJoinDiscussionSVG />', () => {
  it('renders WaitingJoinDiscussionSVG correctly', async () => {
    await renderIconSnapshot(<WaitingJoinDiscussionSVG iconColor="#035ccd" />);
  });

  it('renders WaitingJoinDiscussionSVG focus', async () => {
    await renderIconSnapshot(
      <WaitingJoinDiscussionSVG iconColor="white" focusColor="#035ccd" />,
    );
  });
});

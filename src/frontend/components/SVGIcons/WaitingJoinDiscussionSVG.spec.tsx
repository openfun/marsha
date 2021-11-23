import React from 'react';
import renderer from 'react-test-renderer';
import { WaitingJoinDiscussionSVG } from './WaitingJoinDiscussionSVG';

it('renders WaitingJoinDiscussionSVG correctly', () => {
  const WaitingJoinDiscussionSVGSnapshot = renderer
    .create(<WaitingJoinDiscussionSVG iconColor={'#035ccd'} />)
    .toJSON();
  expect(WaitingJoinDiscussionSVGSnapshot).toMatchSnapshot();
});

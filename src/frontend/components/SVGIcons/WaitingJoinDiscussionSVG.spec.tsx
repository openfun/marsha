import React from 'react';
import renderer from 'react-test-renderer';
import { WaitingJoinDiscussionSVG } from './WaitingJoinDiscussionSVG';

it('renders WaitingJoinDiscussionSVG correctly', () => {
  const WaitingJoinDiscussionSVGSnapshot = renderer
    .create(
      <WaitingJoinDiscussionSVG
        backgroundColor={'none'}
        baseColor={'#035ccd'}
        height={'54'}
        title={'Waiting to join the discussion'}
        width={'54'}
      />,
    )
    .toJSON();
  expect(WaitingJoinDiscussionSVGSnapshot).toMatchSnapshot();
});

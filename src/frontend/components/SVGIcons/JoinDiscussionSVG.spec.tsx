import React from 'react';
import renderer from 'react-test-renderer';
import { JoinDiscussionSVG } from './JoinDiscussionSVG';

it('renders JoinDiscussionSVG correctly', () => {
  const JoinDiscussionSVGSnapshot = renderer
    .create(
      <JoinDiscussionSVG
        baseColor={'blue-off'}
        height={'41.67'}
        hoverColor={'blue-active'}
        title={'Send request to join the discussion'}
        width={'33'}
      />,
    )
    .toJSON();
  expect(JoinDiscussionSVGSnapshot).toMatchSnapshot();
});

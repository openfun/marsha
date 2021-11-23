import React from 'react';
import renderer from 'react-test-renderer';
import { JoinDiscussionSVG } from './JoinDiscussionSVG';

it('renders JoinDiscussionSVG correctly', () => {
  const JoinDiscussionSVGSnapshot = renderer
    .create(
      <JoinDiscussionSVG
        backgroundColor={'none'}
        baseColor={'#035ccd'}
        height={'54'}
        title={'Send request to join the discussion'}
        width={'54'}
      />,
    )
    .toJSON();
  expect(JoinDiscussionSVGSnapshot).toMatchSnapshot();
});

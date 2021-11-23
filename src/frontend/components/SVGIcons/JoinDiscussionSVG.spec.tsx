import React from 'react';
import renderer from 'react-test-renderer';
import { JoinDiscussionSVG } from './JoinDiscussionSVG';

it('renders JoinDiscussionSVG correctly', () => {
  const JoinDiscussionSVGSnapshot = renderer
    .create(<JoinDiscussionSVG iconColor={'#035ccd'} />)
    .toJSON();
  expect(JoinDiscussionSVGSnapshot).toMatchSnapshot();
});

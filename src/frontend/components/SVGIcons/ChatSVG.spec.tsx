import React from 'react';
import renderer from 'react-test-renderer';
import { ChatSVG } from './ChatSVG';

it('renders ChatSVG correctly', () => {
  const ChatSVGSnapshot = renderer
    .create(<ChatSVG iconColor={'#035ccd'} />)
    .toJSON();
  expect(ChatSVGSnapshot).toMatchSnapshot();
});

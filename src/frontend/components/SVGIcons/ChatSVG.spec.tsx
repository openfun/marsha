import React from 'react';
import renderer from 'react-test-renderer';
import { ChatSVG } from './ChatSVG';

it('renders ChatSVG correctly', () => {
  const ChatSVGSnapshot = renderer
    .create(
      <ChatSVG
        baseColor={'blue-off'}
        height={'35.42'}
        hoverColor={'blue-active'}
        title={'Show/Hide Chat'}
        width={'35.42'}
      />,
    )
    .toJSON();
  expect(ChatSVGSnapshot).toMatchSnapshot();
});

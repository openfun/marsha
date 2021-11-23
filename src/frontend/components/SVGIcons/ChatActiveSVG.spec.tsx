import React from 'react';
import renderer from 'react-test-renderer';
import { ChatActiveSVG } from './ChatActiveSVG';

it('renders ChatActiveSVG correctly', () => {
  const ChatActiveSVGSnapshot = renderer
    .create(
      <ChatActiveSVG
        backgroundColor={'#0249a4'}
        baseColor={'white'}
        height={'54'}
        title={'Show/Hide Chat'}
        width={'54'}
      />,
    )
    .toJSON();
  expect(ChatActiveSVGSnapshot).toMatchSnapshot();
});

import React from 'react';
import renderer from 'react-test-renderer';
import { ChatInactiveSVG } from './ChatInactiveSVG';

it('renders ChatInactiveSVG correctly', () => {
  const ChatInactiveSVGSnapshot = renderer
    .create(
      <ChatInactiveSVG
        backgroundColor={'none'}
        baseColor={'#035ccd'}
        height={'54'}
        title={'Show/Hide Chat'}
        width={'54'}
      />,
    )
    .toJSON();
  expect(ChatInactiveSVGSnapshot).toMatchSnapshot();
});

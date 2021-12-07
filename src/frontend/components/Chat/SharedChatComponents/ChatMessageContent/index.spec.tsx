import React from 'react';
import { renderImageSnapshot } from 'utils/tests/imageSnapshot';
import { screen } from '@testing-library/react';

import { ChatMessageContent } from './index';

describe('<ChatMessageContent />', () => {
  it('renders the message content container and compares it with snapshot', () => {
    renderImageSnapshot(
      <ChatMessageContent messageContent={'This is an example message'} />,
    );
    screen.getByText('This is an example message');
  });
});

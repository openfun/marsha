import React from 'react';
import { renderImageSnapshot } from 'utils/tests/imageSnapshot';
import { screen } from '@testing-library/react';

import { ChatMessageType } from 'data/stores/useChatItemsStore/index';
import { ChatMessage } from './index';
import { DateTime } from 'luxon';

const exampleMessage: ChatMessageType = {
  content: 'This is an example message',
  sentAt: DateTime.fromISO('2020-01-01T12:12:12'),
};

describe('<ChatMessage />', () => {
  it('renders the message content container and compares it with previous render [screenshot]', async () => {
    await renderImageSnapshot(<ChatMessage message={exampleMessage} />);
    screen.getByText('This is an example message');
    screen.getByTitle('sent at 12:12:12');
  });
});

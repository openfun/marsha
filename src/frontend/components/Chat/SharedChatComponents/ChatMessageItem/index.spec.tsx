import { DateTime } from 'luxon';
import React from 'react';
import { renderImageSnapshot } from 'utils/tests/imageSnapshot';
import { screen } from '@testing-library/react';

import { ChatMessageItem } from '.';

describe('<ChatMessageItem />', () => {
  it('renders the chatMessagesMetadatas and checks displayed information and sizes are correct.', () => {
    renderImageSnapshot(
      <ChatMessageItem
        msg={{
          sentAt: DateTime.fromISO('2020-01-01T12:12:12'),
          sender: 'John Doe',
          content: 'This is an example message.',
        }}
      />,
    );
    const senderNameDiv = screen.getByTitle("The name of the message's sender");
    const messageTimeDiv = screen.getByTitle(
      'The time at which the message was sent',
    );

    expect(senderNameDiv).toHaveTextContent('John Doe');
    expect(messageTimeDiv).toHaveTextContent('12:12');
    screen.getByText('This is an example message.');
  });
});

import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import { DateTime } from 'luxon';
import React from 'react';

import { ChatMessageMetadatas } from '.';

describe('<ChatMessageMetadatas />', () => {
  it('renders the chatMessagesMetadatas and checks displayed information and sizes are correct.', () => {
    render(
      <ChatMessageMetadatas
        msgSender="John Doe"
        msgDatetime={DateTime.fromISO('2020-01-01T12:12:12')}
      />,
    );
    const chatAvatarDiv = screen.getByTitle("The user's avatar");
    const senderNameDiv = screen.getByTitle("The name of the message's sender");
    const messageTimeDiv = screen.getByTitle(
      'The time at which the message was sent',
    );

    expect(chatAvatarDiv).toHaveStyle({
      width: '26px',
      height: '26px',
    });
    expect(senderNameDiv).toHaveTextContent('John Doe');
    expect(messageTimeDiv).toHaveTextContent('12:12');
  });
});

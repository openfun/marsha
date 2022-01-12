import { DateTime } from 'luxon';
import React from 'react';
import { renderImageSnapshot } from 'utils/tests/imageSnapshot';
import { screen } from '@testing-library/react';

import { ChatMessageGroupType } from 'data/stores/useChatItemsStore/index';
import { ChatMessageGroupItem } from '.';

const groupWithOneMessage: ChatMessageGroupType = {
  sender: 'John Doe',
  messages: [
    {
      content: 'This is an example message',
      sentAt: DateTime.fromISO('2020-01-01T12:12:12'),
    },
  ],
};

const groupWithSeveralMessages: ChatMessageGroupType = {
  sender: 'John Doe',
  messages: [
    {
      content: 'This is an example message 1',
      sentAt: DateTime.fromISO('2020-01-01T12:12:12'),
    },
    {
      content: 'This is an example message 2',
      sentAt: DateTime.fromISO('2020-01-01T12:12:13'),
    },
    {
      content: 'This is an example message 3',
      sentAt: DateTime.fromISO('2020-01-01T12:12:14'),
    },
  ],
};

describe('<ChatMessageGroupItem />', () => {
  it('renders the component when there is only one message and compares it with previous render', async () => {
    await renderImageSnapshot(
      <ChatMessageGroupItem msgGroup={groupWithOneMessage} />,
    );
    screen.getByText('John Doe');
    screen.getByText('(12:12)');
    screen.getByText('This is an example message');
  });

  it('renders the component when there are several messages and compares it with previous render', async () => {
    await renderImageSnapshot(
      <ChatMessageGroupItem msgGroup={groupWithSeveralMessages} />,
    );
    screen.getByText('John Doe');
    screen.getByText('(12:12)');
    screen.getByText('This is an example message 1');
    screen.getByText('This is an example message 2');
    screen.getByText('This is an example message 3');
  });
});

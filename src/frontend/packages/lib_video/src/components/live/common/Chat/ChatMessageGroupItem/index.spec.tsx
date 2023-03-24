import { screen } from '@testing-library/react';
import { renderImageSnapshot } from 'lib-tests';
import { DateTime } from 'luxon';
import React from 'react';

import { ChatMessageGroupType } from '@lib-video/hooks/useChatItemsStore/index';

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
  it('renders the component when there is only one message and compares it with previous render [screenshot]', async () => {
    await renderImageSnapshot(
      <ChatMessageGroupItem msgGroup={groupWithOneMessage} />,
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('(12:12)')).toBeInTheDocument();
    expect(screen.getByText('This is an example message')).toBeInTheDocument();
  });

  it('renders the component when there are several messages and compares it with previous render [screenshot]', async () => {
    await renderImageSnapshot(
      <ChatMessageGroupItem msgGroup={groupWithSeveralMessages} />,
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('(12:12)')).toBeInTheDocument();
    expect(
      screen.getByText('This is an example message 1'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('This is an example message 2'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('This is an example message 3'),
    ).toBeInTheDocument();
  });
});

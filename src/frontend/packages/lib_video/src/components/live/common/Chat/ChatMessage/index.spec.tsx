import { screen } from '@testing-library/react';
import { renderImageSnapshot, render } from 'lib-tests';
import { DateTime } from 'luxon';
import React from 'react';

import { ChatMessageType } from '@lib-video/hooks/useChatItemsStore';

import { ChatMessage } from '.';

const exampleMessage: ChatMessageType = {
  content: 'This is an example message',
  sentAt: DateTime.fromISO('2020-01-01T12:12:12'),
};

const exampleMessageWithUrls: ChatMessageType = {
  content: 'This message contains an url, example-url.com .',
  sentAt: DateTime.fromISO('2020-01-01T12:12:12'),
};

describe('<ChatMessage />', () => {
  it('renders the message content container and compares it with previous render [screenshot]', async () => {
    await renderImageSnapshot(<ChatMessage message={exampleMessage} />);

    expect(screen.getByText('This is an example message')).toBeInTheDocument();
    expect(screen.getByTitle('sent at 12:12:12')).toBeInTheDocument();
  });

  it('renders the message with a clickable url', () => {
    render(<ChatMessage message={exampleMessageWithUrls} />);
    screen.getByTitle('sent at 12:12:12');
    screen.getByText('This message contains an url, .');
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'http://example-url.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    screen.getByText('example-url.com');
  });
});

import { DateTime } from 'luxon';
import React from 'react';
import { renderImageSnapshot } from 'utils/tests/imageSnapshot';
import { screen } from '@testing-library/react';

import { ChatPresenceType, presenceType } from 'data/stores/useChatItemsStore';
import { ChatPresenceItem } from './index';

const chatPresenceTypeArrival: ChatPresenceType = {
  receivedAt: DateTime.fromISO('2020-01-01T12:12:12'),
  sender: 'John_Doe',
  type: presenceType.ARRIVAL,
};

const chatPresenceTypeDeparture: ChatPresenceType = {
  receivedAt: DateTime.fromISO('2020-01-01T12:12:12'),
  sender: 'John_Doe',
  type: presenceType.DEPARTURE,
};

describe('<ChatPresenceItem />', () => {
  it('renders the component and compares it with a previous render, for an arrival presence.', async () => {
    await renderImageSnapshot(
      <ChatPresenceItem presenceItem={chatPresenceTypeArrival} />,
    );
    screen.getByText('John_Doe has joined');
  });

  it('renders the component and compares it with a previous render, for a departure presence.', async () => {
    await renderImageSnapshot(
      <ChatPresenceItem presenceItem={chatPresenceTypeDeparture} />,
    );
    screen.getByText('John_Doe has left');
  });
});

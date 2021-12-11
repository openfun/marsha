import React from 'react';
import { render, screen } from '@testing-library/react';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { ChatWrapper } from '.';

describe('<ChatWrapper />', () => {
  it('renders <StudentShowChatButton /> when panel is closed and the chat is not selected', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: LivePanelItem.JOIN_DISCUSSION,
      availableItems: [LivePanelItem.CHAT, LivePanelItem.JOIN_DISCUSSION],
    });

    render(wrapInIntlProvider(<ChatWrapper />));

    screen.getByRole('button', { name: 'Show chat' });
    expect(
      screen.queryByRole('button', { name: 'Hide chat' }),
    ).not.toBeInTheDocument();
  });
  it('renders <StudentShowChatButton /> when panel is closed and the chat is selected', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.CHAT, LivePanelItem.JOIN_DISCUSSION],
    });

    render(wrapInIntlProvider(<ChatWrapper />));

    screen.getByRole('button', { name: 'Show chat' });
    expect(
      screen.queryByRole('button', { name: 'Hide chat' }),
    ).not.toBeInTheDocument();
  });
  it('renders <StudentShowChatButton /> when panel is open and the chat is not selected', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.JOIN_DISCUSSION,
      availableItems: [LivePanelItem.CHAT, LivePanelItem.JOIN_DISCUSSION],
    });

    render(wrapInIntlProvider(<ChatWrapper />));

    screen.getByRole('button', { name: 'Show chat' });
    expect(
      screen.queryByRole('button', { name: 'Hide chat' }),
    ).not.toBeInTheDocument();
  });
  it('renders <StudentHideChatButton /> when panel is open and the chat is selected', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.CHAT, LivePanelItem.JOIN_DISCUSSION],
    });

    render(wrapInIntlProvider(<ChatWrapper />));

    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Hide chat' });
  });
});

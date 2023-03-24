import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';

import { ChatWrapper } from '.';

describe('<ChatWrapper />', () => {
  it('renders <StudentShowChatButton /> when panel is closed and the chat is not selected', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: LivePanelItem.VIEWERS_LIST,
      availableItems: [LivePanelItem.CHAT, LivePanelItem.VIEWERS_LIST],
    });

    render(<ChatWrapper />);

    screen.getByRole('button', { name: 'Show chat' });
    expect(
      screen.queryByRole('button', { name: 'Hide chat' }),
    ).not.toBeInTheDocument();
  });

  it('renders <StudentShowChatButton /> when panel is closed and the chat is selected', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.CHAT, LivePanelItem.VIEWERS_LIST],
    });

    render(<ChatWrapper />);

    screen.getByRole('button', { name: 'Show chat' });
    expect(
      screen.queryByRole('button', { name: 'Hide chat' }),
    ).not.toBeInTheDocument();
  });

  it('renders <StudentShowChatButton /> when panel is open and the chat is not selected', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.VIEWERS_LIST,
      availableItems: [LivePanelItem.CHAT, LivePanelItem.VIEWERS_LIST],
    });

    render(<ChatWrapper />);

    screen.getByRole('button', { name: 'Show chat' });
    expect(
      screen.queryByRole('button', { name: 'Hide chat' }),
    ).not.toBeInTheDocument();
  });

  it('renders <StudentHideChatButton /> when panel is open and the chat is selected', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.CHAT, LivePanelItem.VIEWERS_LIST],
    });

    render(<ChatWrapper />);

    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Hide chat' });
  });
});

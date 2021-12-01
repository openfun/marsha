import React from 'react';
import { render, screen } from '@testing-library/react';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { videoMockFactory } from 'utils/tests/factories';
import { renderImageSnapshot } from 'utils/tests/imageSnapshot';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { LiveVideoPanel } from '.';

const mockVideo = videoMockFactory({
  xmpp: {
    bosh_url: 'https://xmpp-server.com/http-bind',
    websocket_url: null,
    conference_url:
      '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
    prebind_url: 'https://xmpp-server.com/http-pre-bind',
    jid: 'xmpp-server.com',
  },
});
jest.mock('data/appData', () => ({
  appData: {
    video: mockVideo,
  },
}));

describe('<LiveVideoPanel />', () => {
  it('closes the panel if no item is selected', () => {
    const mockSetPanelVisibility = jest.fn();
    useLivePanelState.setState({
      currentItem: undefined,
      availableItems: [
        LivePanelItem.APPLICATION,
        LivePanelItem.CHAT,
        LivePanelItem.JOIN_DISCUSSION,
      ],
      setPanelVisibility: mockSetPanelVisibility,
    });

    const { container } = render(
      wrapInIntlProvider(<LiveVideoPanel video={mockVideo} />),
    );

    expect(mockSetPanelVisibility).toBeCalled();
    expect(mockSetPanelVisibility).toBeCalledTimes(1);
    expect(mockSetPanelVisibility).toBeCalledWith(false);

    expect(container.hasChildNodes()).toBe(false);
  });

  it('renders the content with selection', () => {
    useLivePanelState.setState({
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [
        LivePanelItem.APPLICATION,
        LivePanelItem.CHAT,
        LivePanelItem.JOIN_DISCUSSION,
      ],
    });

    render(wrapInIntlProvider(<LiveVideoPanel video={mockVideo} />));

    screen.getByRole('tablist');
    screen.getByRole('tab', { name: 'application' });
    screen.getByRole('tab', { name: 'chat' });
    screen.getByRole('tab', { name: 'viewers' });

    screen.getByText('application content');
  });

  it('does not render tabs with only one item available', () => {
    useLivePanelState.setState({
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [LivePanelItem.APPLICATION],
    });

    render(wrapInIntlProvider(<LiveVideoPanel video={mockVideo} />));

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: 'application' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'chat' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: 'viewers' }),
    ).not.toBeInTheDocument();

    screen.getByText('application content');
  });

  it('renders with appropriate style on large screen', async () => {
    useLivePanelState.setState({
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [
        LivePanelItem.APPLICATION,
        LivePanelItem.CHAT,
        LivePanelItem.JOIN_DISCUSSION,
      ],
    });

    await renderImageSnapshot(<LiveVideoPanel video={mockVideo} />);
  });

  it('renders with appropriate style on small screen', async () => {
    useLivePanelState.setState({
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [
        LivePanelItem.APPLICATION,
        LivePanelItem.CHAT,
        LivePanelItem.JOIN_DISCUSSION,
      ],
    });

    await renderImageSnapshot(<LiveVideoPanel video={mockVideo} />, 300, 300);
  });
});

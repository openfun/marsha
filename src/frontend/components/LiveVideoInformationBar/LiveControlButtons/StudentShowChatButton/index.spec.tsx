import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import {
  LivePanelDetail,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { StudentShowChatButton } from '.';

describe('<StudentShowChatButton />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('show the chat onClick when chat is not selected and panel is closed', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      availableDetails: [LivePanelDetail.JOIN_DISCUSSION, LivePanelDetail.CHAT],
      currentDetail: LivePanelDetail.JOIN_DISCUSSION,
    });
    const Compo = <StudentShowChatButton />;

    render(wrapInIntlProvider(Compo));
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(useLivePanelState.getState().isPanelVisible).toBeTruthy();
    expect(useLivePanelState.getState().currentDetail).toEqual(
      LivePanelDetail.CHAT,
    );
  });

  it('show the chat onClick when chat is selected and panel is closed', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      availableDetails: [LivePanelDetail.JOIN_DISCUSSION, LivePanelDetail.CHAT],
      currentDetail: LivePanelDetail.CHAT,
    });

    const Compo = <StudentShowChatButton />;

    render(wrapInIntlProvider(Compo));
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(useLivePanelState.getState().isPanelVisible).toBeTruthy();
    expect(useLivePanelState.getState().currentDetail).toEqual(
      LivePanelDetail.CHAT,
    );
  });

  it('show the chat onClick when chat is not selected and panel is open', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      availableDetails: [LivePanelDetail.JOIN_DISCUSSION, LivePanelDetail.CHAT],
      currentDetail: LivePanelDetail.JOIN_DISCUSSION,
    });

    const Compo = <StudentShowChatButton />;

    render(wrapInIntlProvider(Compo));
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(useLivePanelState.getState().isPanelVisible).toBeTruthy();
    expect(useLivePanelState.getState().currentDetail).toEqual(
      LivePanelDetail.CHAT,
    );
  });

  it('hide the chat on click when chat is selected and panel is open', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      availableDetails: [LivePanelDetail.JOIN_DISCUSSION, LivePanelDetail.CHAT],
      currentDetail: LivePanelDetail.CHAT,
    });

    const Compo = <StudentShowChatButton />;

    render(wrapInIntlProvider(Compo));
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(useLivePanelState.getState().isPanelVisible).toBeFalsy();
    expect(useLivePanelState.getState().currentDetail).toEqual(
      LivePanelDetail.CHAT,
    );
  });
});

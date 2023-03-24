import { screen } from '@testing-library/react';
import {
  participantMockFactory,
  videoMockFactory,
  liveState,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { ViewersWrapper } from '.';

describe('<ViewersWrapper />', () => {
  it('renders <StudentShowViewersButton /> when panel is closed and viewers is not selected', () => {
    const video = videoMockFactory({
      participants_asking_to_join: [],
      live_state: liveState.IDLE,
    });
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [LivePanelItem.VIEWERS_LIST, LivePanelItem.APPLICATION],
    });

    render(wrapInVideo(<ViewersWrapper />, video));

    screen.getByRole('button', { name: 'Show viewers' });
    expect(
      screen.queryByRole('button', { name: 'Hide viewers' }),
    ).not.toBeInTheDocument();
  });

  it('renders <StudentShowViewersButton /> when panel is closed and viewers is selected', () => {
    const video = videoMockFactory({
      participants_asking_to_join: [],
      live_state: liveState.IDLE,
    });
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: LivePanelItem.VIEWERS_LIST,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.CHAT],
    });

    render(wrapInVideo(<ViewersWrapper />, video));

    screen.getByRole('button', { name: 'Show viewers' });
    expect(
      screen.queryByRole('button', { name: 'Hide viewers' }),
    ).not.toBeInTheDocument();
  });

  it('renders <StudentShowViewersButton /> when panel is opened but not selecting viewers', () => {
    const video = videoMockFactory({
      participants_asking_to_join: [],
      live_state: liveState.IDLE,
    });
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [LivePanelItem.VIEWERS_LIST, LivePanelItem.APPLICATION],
    });

    render(wrapInVideo(<ViewersWrapper />, video));

    screen.getByRole('button', { name: 'Show viewers' });
    expect(
      screen.queryByRole('button', { name: 'Hide viewers' }),
    ).not.toBeInTheDocument();
  });

  it('renders <StudentShowViewersButton /> when panel is opened and viewers is selected', () => {
    const video = videoMockFactory({
      participants_asking_to_join: [],
      live_state: liveState.IDLE,
    });
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.VIEWERS_LIST,
      availableItems: [LivePanelItem.VIEWERS_LIST, LivePanelItem.APPLICATION],
    });

    render(wrapInVideo(<ViewersWrapper />, video));

    expect(
      screen.queryByRole('button', { name: 'Show viewers' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Hide viewers' });
  });

  it('renders <StudentShowViewersButton /> with one user wanting to go on stage', () => {
    const video = videoMockFactory({
      participants_asking_to_join: [participantMockFactory()],
      live_state: liveState.IDLE,
    });

    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.VIEWERS_LIST,
      availableItems: [LivePanelItem.VIEWERS_LIST, LivePanelItem.APPLICATION],
    });

    render(wrapInVideo(<ViewersWrapper />, video));

    expect(
      screen.queryByRole('button', { name: 'Show viewers' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Hide viewers' });
    screen.getByText(1);
  });

  it('renders <StudentShowViewersButton /> with several users wanting to go on stage', () => {
    const video = videoMockFactory({
      participants_asking_to_join: [
        participantMockFactory(),
        participantMockFactory(),
        participantMockFactory(),
        participantMockFactory(),
        participantMockFactory(),
        participantMockFactory(),
        participantMockFactory(),
        participantMockFactory(),
        participantMockFactory(),
        participantMockFactory(),
        participantMockFactory(),
      ],
      live_state: liveState.IDLE,
    });

    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.VIEWERS_LIST,
      availableItems: [LivePanelItem.VIEWERS_LIST, LivePanelItem.APPLICATION],
    });

    render(wrapInVideo(<ViewersWrapper />, video));

    expect(
      screen.queryByRole('button', { name: 'Show viewers' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Hide viewers' });
    screen.getByText(11);
  });
});

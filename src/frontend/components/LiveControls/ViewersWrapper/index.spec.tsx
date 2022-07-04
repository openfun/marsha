import React from 'react';
import { screen } from '@testing-library/react';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import {
  participantMockFactory,
  videoMockFactory,
} from 'utils/tests/factories';
import render from 'utils/tests/render';

import { ViewersWrapper } from '.';

describe('<ViewersWrapper />', () => {
  it('renders <StudentShowViewersButton /> when panel is closed and viewers is not selected', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [LivePanelItem.VIEWERS_LIST, LivePanelItem.APPLICATION],
    });

    render(<ViewersWrapper />);

    screen.getByRole('button', { name: 'Show viewers' });
    expect(
      screen.queryByRole('button', { name: 'Hide viewers' }),
    ).not.toBeInTheDocument();
  });

  it('renders <StudentShowViewersButton /> when panel is closed and viewers is selected', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
      currentItem: LivePanelItem.VIEWERS_LIST,
      availableItems: [LivePanelItem.APPLICATION, LivePanelItem.CHAT],
    });

    render(<ViewersWrapper />);

    screen.getByRole('button', { name: 'Show viewers' });
    expect(
      screen.queryByRole('button', { name: 'Hide viewers' }),
    ).not.toBeInTheDocument();
  });

  it('renders <StudentShowViewersButton /> when panel is opened but not selecting viewers', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [LivePanelItem.VIEWERS_LIST, LivePanelItem.APPLICATION],
    });

    render(<ViewersWrapper />);

    screen.getByRole('button', { name: 'Show viewers' });
    expect(
      screen.queryByRole('button', { name: 'Hide viewers' }),
    ).not.toBeInTheDocument();
  });

  it('renders <StudentShowViewersButton /> when panel is opened and viewers is selected', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.VIEWERS_LIST,
      availableItems: [LivePanelItem.VIEWERS_LIST, LivePanelItem.APPLICATION],
    });

    render(<ViewersWrapper />);

    expect(
      screen.queryByRole('button', { name: 'Show viewers' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Hide viewers' });
  });

  it('renders <StudentShowViewersButton /> with one user wanting to go on stage', () => {
    const video = videoMockFactory({
      participants_asking_to_join: [participantMockFactory()],
    });

    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.VIEWERS_LIST,
      availableItems: [LivePanelItem.VIEWERS_LIST, LivePanelItem.APPLICATION],
    });

    render(<ViewersWrapper video={video} />);

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
    });

    useLivePanelState.setState({
      isPanelVisible: true,
      currentItem: LivePanelItem.VIEWERS_LIST,
      availableItems: [LivePanelItem.VIEWERS_LIST, LivePanelItem.APPLICATION],
    });

    render(<ViewersWrapper video={video} />);

    expect(
      screen.queryByRole('button', { name: 'Show viewers' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Hide viewers' });
    screen.getByText(11);
  });
});

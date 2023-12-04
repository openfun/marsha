import { screen } from '@testing-library/react';
import { useCurrentResourceContext } from 'lib-components';
import { participantMockFactory, videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';
import { useParticipantsStore } from '@lib-video/hooks/useParticipantsStore';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { LiveVideoPanel } from '.';

const mockAskingParticipant = participantMockFactory();
const mockParticipant = participantMockFactory();

const mockVideo = videoMockFactory({
  participants_asking_to_join: [mockAskingParticipant],
  participants_in_discussion: [mockParticipant],
});

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useCurrentResourceContext: jest.fn(),
}));
const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

describe('<LiveVideoPanel />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('closes the panel if no item is selected', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: false,
          can_update: false,
        },
      },
    ] as any);
    const mockSetPanelVisibility = jest.fn();
    useLivePanelState.setState({
      currentItem: undefined,
      availableItems: [
        LivePanelItem.APPLICATION,
        LivePanelItem.CHAT,
        LivePanelItem.VIEWERS_LIST,
      ],
      setPanelVisibility: mockSetPanelVisibility,
    });

    const { elementContainer: container } = render(
      wrapInVideo(<LiveVideoPanel isLive />, mockVideo),
    );

    expect(mockSetPanelVisibility).toHaveBeenCalled();
    expect(mockSetPanelVisibility).toHaveBeenCalledTimes(1);
    expect(mockSetPanelVisibility).toHaveBeenCalledWith(false);

    expect(container!.hasChildNodes()).toBe(false);
  });

  it('renders the content with selection', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: false,
          can_update: false,
        },
      },
    ] as any);
    useLivePanelState.setState({
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [
        LivePanelItem.APPLICATION,
        LivePanelItem.CHAT,
        LivePanelItem.VIEWERS_LIST,
      ],
    });

    render(wrapInVideo(<LiveVideoPanel isLive />, mockVideo));

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'application' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'chat' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'viewers' })).toBeInTheDocument();

    expect(screen.getByText('application content')).toBeInTheDocument();
  });

  it('renders the correct viewers list if the user is not an instructor', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_update: false,
        },
      },
    ] as any);

    useParticipantsStore.setState({
      participants: [
        {
          ...mockParticipant,
          userJid: 'userJid-anonymous',
          isInstructor: false,
          isOnStage: false,
        },
      ],
    });
    useLivePanelState.setState({
      currentItem: LivePanelItem.VIEWERS_LIST,
      availableItems: [
        LivePanelItem.APPLICATION,
        LivePanelItem.CHAT,
        LivePanelItem.VIEWERS_LIST,
      ],
    });

    render(wrapInVideo(<LiveVideoPanel isLive />, mockVideo));

    screen.getByRole('tablist');
    screen.getByRole('tab', { name: 'application' });
    screen.getByRole('tab', { name: 'chat' });
    screen.getByRole('tab', { name: 'viewers' });

    screen.getByText('On stage (1)');
    screen.getByText('Other participants (0)');
    screen.getByText(mockParticipant.name);
    expect(screen.queryByText('Demands')).toEqual(null);
    expect(screen.queryByText(mockAskingParticipant.name)).toEqual(null);
  });

  it('renders the correct viewers list if the user is an instructor', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_update: true,
        },
      },
    ] as any);

    useParticipantsStore.setState({
      participants: [
        {
          ...mockParticipant,
          userJid: 'userJid-anonymous',
          isInstructor: false,
          isOnStage: false,
        },
      ],
    });

    useLivePanelState.setState({
      currentItem: LivePanelItem.VIEWERS_LIST,
      availableItems: [
        LivePanelItem.APPLICATION,
        LivePanelItem.CHAT,
        LivePanelItem.VIEWERS_LIST,
      ],
    });

    render(wrapInVideo(<LiveVideoPanel isLive />, mockVideo));

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    screen.getByRole('tab', { name: 'application' });
    screen.getByRole('tab', { name: 'chat' });
    screen.getByRole('tab', { name: 'viewers' });

    screen.getByText('On stage (1)');
    screen.getByText(mockParticipant.name);
    screen.getByText('Demands (1)');
    screen.getByText('Other participants (0)');
    screen.getByText(mockAskingParticipant.name);
  });

  it('does not render tabs with only one item available', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: false,
          can_update: false,
        },
      },
    ] as any);
    useLivePanelState.setState({
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [LivePanelItem.APPLICATION],
    });

    render(wrapInVideo(<LiveVideoPanel isLive />, mockVideo));

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
});

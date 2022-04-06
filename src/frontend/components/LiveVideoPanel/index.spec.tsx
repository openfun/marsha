import React from 'react';
import { render, screen } from '@testing-library/react';

import { getDecodedJwt } from 'data/appData';
import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { useParticipantsStore } from 'data/stores/useParticipantsStore';
import {
  participantMockFactory,
  videoMockFactory,
} from 'utils/tests/factories';
import { renderImageSnapshot } from 'utils/tests/imageSnapshot';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { DecodedJwt } from 'types/jwt';
import { LiveVideoPanel } from '.';

const mockAskingParticipant = participantMockFactory();
const mockParticipant = participantMockFactory();

const mockVideo = videoMockFactory({
  participants_asking_to_join: [mockAskingParticipant],
  participants_in_discussion: [mockParticipant],
});

jest.mock('data/appData', () => ({
  getDecodedJwt: jest.fn(),
}));
const mockGetDecodedJwt = getDecodedJwt as jest.MockedFunction<
  typeof getDecodedJwt
>;

describe('<LiveVideoPanel />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('closes the panel if no item is selected', () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
    } as DecodedJwt);
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

    const { container } = render(
      wrapInIntlProvider(<LiveVideoPanel video={mockVideo} />),
    );

    expect(mockSetPanelVisibility).toBeCalled();
    expect(mockSetPanelVisibility).toBeCalledTimes(1);
    expect(mockSetPanelVisibility).toBeCalledWith(false);

    expect(container.hasChildNodes()).toBe(false);
  });

  it('renders the content with selection', () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
    } as DecodedJwt);
    useLivePanelState.setState({
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [
        LivePanelItem.APPLICATION,
        LivePanelItem.CHAT,
        LivePanelItem.VIEWERS_LIST,
      ],
    });

    render(wrapInIntlProvider(<LiveVideoPanel video={mockVideo} />));

    screen.getByRole('tablist');
    screen.getByRole('tab', { name: 'application' });
    screen.getByRole('tab', { name: 'chat' });
    screen.getByRole('tab', { name: 'viewers' });

    screen.getByText('application content');
  });

  it('renders the correct viewers list if the user is not an instructor', () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_update: false,
      },
    } as DecodedJwt);

    useParticipantsStore.setState({
      participants: [
        {
          ...mockParticipant,
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

    render(wrapInIntlProvider(<LiveVideoPanel video={mockVideo} />));

    screen.getByRole('tablist');
    screen.getByRole('tab', { name: 'application' });
    screen.getByRole('tab', { name: 'chat' });
    screen.getByRole('tab', { name: 'viewers' });

    screen.getByText('On stage');
    screen.getByText(mockParticipant.name);
    expect(screen.queryByText('Demands')).toEqual(null);
    expect(screen.queryByText(mockAskingParticipant.name)).toEqual(null);
  });

  it('renders the correct viewers list if the user is an instructor', () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_update: true,
      },
    } as DecodedJwt);

    useParticipantsStore.setState({
      participants: [
        {
          ...mockParticipant,
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

    render(wrapInIntlProvider(<LiveVideoPanel video={mockVideo} />));

    screen.getByRole('tablist');
    screen.getByRole('tab', { name: 'application' });
    screen.getByRole('tab', { name: 'chat' });
    screen.getByRole('tab', { name: 'viewers' });

    screen.getByText('On stage');
    screen.getByText(mockParticipant.name);
    screen.getByText('Demands');
    screen.getByText(mockAskingParticipant.name);
  });

  it('does not render tabs with only one item available', () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
    } as DecodedJwt);
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
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
    } as DecodedJwt);
    useLivePanelState.setState({
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [
        LivePanelItem.APPLICATION,
        LivePanelItem.CHAT,
        LivePanelItem.VIEWERS_LIST,
      ],
    });

    await renderImageSnapshot(<LiveVideoPanel video={mockVideo} />);
  });

  it('renders with appropriate style on small screen', async () => {
    mockGetDecodedJwt.mockReturnValue({
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
    } as DecodedJwt);
    useLivePanelState.setState({
      currentItem: LivePanelItem.APPLICATION,
      availableItems: [
        LivePanelItem.APPLICATION,
        LivePanelItem.CHAT,
        LivePanelItem.VIEWERS_LIST,
      ],
    });

    await renderImageSnapshot(<LiveVideoPanel video={mockVideo} />, 300, 300);
  });
});

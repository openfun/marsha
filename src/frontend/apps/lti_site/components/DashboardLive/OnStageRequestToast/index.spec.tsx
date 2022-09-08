import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import toast from 'react-hot-toast';

import {
  useLivePanelState,
  LivePanelItem,
} from 'data/stores/useLivePanelState';
import { participantMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { OnStageRequestToast } from '.';

jest.spyOn(toast, 'remove');

describe('<OnStageRequestToast />', () => {
  it('displays the notification and clicks and the action button', () => {
    const participants = [participantMockFactory(), participantMockFactory()];
    const mockSetPanelVisibility = jest.fn();
    useLivePanelState.setState({
      currentItem: undefined,
      availableItems: [LivePanelItem.CHAT, LivePanelItem.VIEWERS_LIST],
      setPanelVisibility: mockSetPanelVisibility,
    });

    render(<OnStageRequestToast participantsList={participants} />);

    screen.getByText(
      `${participants[1].name} and ${participants[0].name} want to go on stage.`,
    );
    const manageRequestButton = screen.getByRole('button', {
      name: 'Manage requests',
    });
    act(() => userEvent.click(manageRequestButton));
    expect(mockSetPanelVisibility).toHaveBeenCalledWith(
      true,
      LivePanelItem.VIEWERS_LIST,
    );
    expect(mockSetPanelVisibility).toHaveBeenCalledTimes(1);
    expect(toast.remove).toHaveBeenCalledWith('onStageRequestToastId');
    expect(toast.remove).toHaveBeenCalledTimes(1);
  });
});

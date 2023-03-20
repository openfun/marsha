import { act, screen, waitFor } from '@testing-library/react';
import { Participant, videoMockFactory } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { TabPanelWebinar } from '.';

describe('<TabPanelWebinar />', () => {
  it('checks render depends option live panel choosen', async () => {
    const mockSetPanelVisibility = jest.fn();

    const livePanelState = {
      setPanelVisibility: mockSetPanelVisibility,
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.VIEWERS_LIST, LivePanelItem.CHAT],
    };
    useLivePanelState.setState(livePanelState);

    const mockedVideo = videoMockFactory({
      participants_asking_to_join: [
        {} as Participant,
        {} as Participant,
        {} as Participant,
      ],
    });

    render(wrapInVideo(<TabPanelWebinar />, mockedVideo));

    expect(
      screen.getByRole('button', { name: 'Show webinar' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show chat' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show viewers' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('badge_container')).toHaveTextContent('3');
    await waitFor(() => {
      expect(mockSetPanelVisibility).toHaveBeenCalledTimes(1);
    });

    act(() => {
      useLivePanelState.setState({
        ...livePanelState,
        availableItems: [LivePanelItem.VIEWERS_LIST],
      });
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Show chat' }),
      ).not.toBeInTheDocument();
    });
  });

  it('checks tabs interaction', async () => {
    const livePanelState = {
      isPanelVisible: true,
      currentItem: LivePanelItem.CHAT,
      availableItems: [LivePanelItem.VIEWERS_LIST, LivePanelItem.CHAT],
    };
    useLivePanelState.setState(livePanelState);

    const mockedVideo = videoMockFactory({
      participants_asking_to_join: [
        {} as Participant,
        {} as Participant,
        {} as Participant,
      ],
    });

    render(wrapInVideo(<TabPanelWebinar />, mockedVideo));

    await waitFor(
      () => {
        expect(useLivePanelState.getState().isPanelVisible).toBeFalsy();
      },
      { timeout: 1000 },
    );

    screen.getByRole('button', { name: 'Show viewers' }).click();
    expect(useLivePanelState.getState().isPanelVisible).toBeTruthy();
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.VIEWERS_LIST,
    );
    const slidingBox = screen.getByRole('tab');
    expect(slidingBox).toHaveStyle('transform: translateX(200%)');

    screen.getByRole('button', { name: 'Show chat' }).click();
    expect(useLivePanelState.getState().currentItem).toEqual(
      LivePanelItem.CHAT,
    );
    expect(slidingBox).toHaveStyle('transform: translateX(100%)');

    screen.getByRole('button', { name: 'Show webinar' }).click();
    expect(useLivePanelState.getState().isPanelVisible).toBeFalsy();
    expect(slidingBox).not.toHaveStyle('transform: translateX(100%)');
  });
});

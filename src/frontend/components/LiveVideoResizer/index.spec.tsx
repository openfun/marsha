import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { useLivePanelState } from 'data/stores/useLivePanelState/index';
import { LiveVideoResizer } from '.';

const LeftCompo = <p>left component</p>;
const RightCompo = <p>right component</p>;

const mockedSetSavedPanelWidthPx = jest.fn();

describe('<LiveVideoResizer />', () => {
  beforeAll(() => {
    jest.resetAllMocks();
  });

  it('renders component with panel opened and then clicks on close button', () => {
    useLivePanelState.setState({
      isPanelVisible: true,
    });
    render(
      <LiveVideoResizer
        isReadyToDisplayRightElement={true}
        isPanelOpen={true}
        leftElement={LeftCompo}
        rightElement={RightCompo}
        savedPanelWidthPx={300}
        setSavedPanelWidthPx={mockedSetSavedPanelWidthPx}
      />,
    );
    screen.getByText('left component');
    screen.getByText('right component');

    const closeButton = screen.getByRole('button');
    act(() => userEvent.click(closeButton));

    expect(useLivePanelState.getState().isPanelVisible).toEqual(false);
    expect(mockedSetSavedPanelWidthPx).toHaveBeenCalledTimes(1);
  });

  it('renders component with panel closed and then clicks on open button', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
    });
    render(
      <LiveVideoResizer
        isReadyToDisplayRightElement={true}
        isPanelOpen={false}
        leftElement={LeftCompo}
        rightElement={RightCompo}
        savedPanelWidthPx={300}
        setSavedPanelWidthPx={mockedSetSavedPanelWidthPx}
      />,
    );
    screen.getByText('left component');
    expect(screen.queryByText('right component')).toBeNull();

    const openButton = screen.getByRole('button');
    act(() => userEvent.click(openButton));

    expect(useLivePanelState.getState().isPanelVisible).toEqual(true);
    expect(screen.queryByText('right component')).toBeNull();
  });

  it('renders component with panel closed, but video not started and clicks on open button (not ready to display panel)', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
    });
    render(
      <LiveVideoResizer
        isReadyToDisplayRightElement={false}
        isPanelOpen={false}
        leftElement={LeftCompo}
        rightElement={RightCompo}
        savedPanelWidthPx={300}
        setSavedPanelWidthPx={mockedSetSavedPanelWidthPx}
      />,
    );
    screen.getByText('left component');
    expect(screen.queryByText('right component')).toBeNull();

    const openButton = screen.getByRole('button');
    act(() => userEvent.click(openButton));

    expect(openButton).toBeDisabled();
    expect(useLivePanelState.getState().isPanelVisible).toEqual(false);
  });

  // This situation is not supposed to happen
  it('renders component with panel opened, but video not started (not ready to display panel)', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
    });
    render(
      <LiveVideoResizer
        isReadyToDisplayRightElement={false}
        isPanelOpen={true}
        leftElement={LeftCompo}
        rightElement={RightCompo}
        savedPanelWidthPx={300}
        setSavedPanelWidthPx={mockedSetSavedPanelWidthPx}
      />,
    );
    screen.getByText('left component');
    expect(screen.queryByText('right component')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

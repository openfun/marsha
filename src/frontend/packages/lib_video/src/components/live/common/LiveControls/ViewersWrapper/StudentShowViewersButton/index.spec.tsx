import { screen, fireEvent } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';

import { StudentShowViewersButton } from '.';

describe('<StudentShowViewersButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the student show viewers button [screenshot]', () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    render(<StudentShowViewersButton />);

    expect(
      screen.getByRole('button', { name: 'Show viewers' }),
    ).toBeInTheDocument();
  });

  it('opens the panel and select viewers item', () => {
    const mockSetPanelVisibility = jest.fn();
    useLivePanelState.setState({
      setPanelVisibility: mockSetPanelVisibility,
    });

    render(<StudentShowViewersButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Show viewers' }));

    expect(mockSetPanelVisibility).toHaveBeenCalledTimes(1);
    expect(mockSetPanelVisibility).toHaveBeenCalledWith(
      true,
      LivePanelItem.VIEWERS_LIST,
    );
  });
});

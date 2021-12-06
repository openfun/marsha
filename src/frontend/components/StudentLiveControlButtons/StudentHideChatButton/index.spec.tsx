import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { useLivePanelState } from 'data/stores/useLivePanelState';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { StudentHideChatButton } from '.';

jest.mock('components/SVGIcons/ChatSVG', () => ({
  ChatSVG: () => <span>chat icon</span>,
}));

describe('<StudentHideChatButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the hide chat button', () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    render(wrapInIntlProvider(<StudentHideChatButton />));

    screen.getByRole('button', { name: 'Hide chat' });
    screen.getByText('chat icon');
  });

  it('closes the panel on click', () => {
    const mockSetPAnelVisibility = jest.fn();
    useLivePanelState.setState({
      setPanelVisibility: mockSetPAnelVisibility,
    });

    render(wrapInIntlProvider(<StudentHideChatButton />));

    fireEvent.click(screen.getByRole('button', { name: 'Hide chat' }));

    expect(mockSetPAnelVisibility).toHaveBeenCalledTimes(1);
    expect(mockSetPAnelVisibility).toHaveBeenCalledWith(false);
  });
});

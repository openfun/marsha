import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { StopLiveButton } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

const mockSetStopLiveConfirmation = jest.fn();
jest.mock('data/stores/useStopLiveConfirmation', () => ({
  useStopLiveConfirmation: () => [false, mockSetStopLiveConfirmation],
}));

describe('<StopLiveButton />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('updates the state to open a confirmation modal', async () => {
    const video = videoMockFactory();

    render(wrapInIntlProvider(<StopLiveButton video={video} />));

    expect(screen.queryByTestId('loader-id')).not.toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: 'End live' }));

    expect(mockSetStopLiveConfirmation).toHaveBeenCalled();
    expect(mockSetStopLiveConfirmation).toHaveBeenCalledWith(true);
  });
});

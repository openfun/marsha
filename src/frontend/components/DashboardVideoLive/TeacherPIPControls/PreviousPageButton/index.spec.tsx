import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import React from 'react';

import { navigateSharingDoc } from 'data/sideEffects/navigateSharingDoc';
import { SharedMediaCurrentPageProvider } from 'data/stores/useSharedMediaCurrentPage';
import { videoMockFactory } from 'utils/tests/factories';

import { PreviousPageButton } from '.';

jest.mock('data/sideEffects/navigateSharingDoc', () => ({
  navigateSharingDoc: jest.fn(),
}));
const mockedNavigateSharingDoc = navigateSharingDoc as jest.MockedFunction<
  typeof navigateSharingDoc
>;

describe('<PreviousPageButton />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the button', () => {
    const video = videoMockFactory();

    render(
      <SharedMediaCurrentPageProvider value={{ page: 2, imageUrl: 'some url' }}>
        <PreviousPageButton video={video} />
      </SharedMediaCurrentPageProvider>,
    );

    userEvent.click(screen.getByTestId('pip-previous-button'));
    expect(mockedNavigateSharingDoc).toHaveBeenCalledWith(video, 1);
  });

  it('disable the button on first page', () => {
    const video = videoMockFactory();

    render(
      <SharedMediaCurrentPageProvider value={{ page: 1, imageUrl: 'some url' }}>
        <PreviousPageButton video={video} />
      </SharedMediaCurrentPageProvider>,
    );

    expect(screen.getByTestId('pip-previous-button')).toBeDisabled();
  });
});

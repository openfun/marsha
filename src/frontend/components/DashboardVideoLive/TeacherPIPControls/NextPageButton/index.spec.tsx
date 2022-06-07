import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { navigateSharingDoc } from 'data/sideEffects/navigateSharingDoc';
import { SharedMediaCurrentPageProvider } from 'data/stores/useSharedMediaCurrentPage';
import { videoMockFactory } from 'utils/tests/factories';

import { NextPageButton } from '.';

jest.mock('data/sideEffects/navigateSharingDoc', () => ({
  navigateSharingDoc: jest.fn(),
}));
const mockedNavigateSharingDoc = navigateSharingDoc as jest.MockedFunction<
  typeof navigateSharingDoc
>;

describe('<NextPageButton />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the button', () => {
    const video = videoMockFactory();

    render(
      <SharedMediaCurrentPageProvider value={{ page: 2, imageUrl: 'some url' }}>
        <NextPageButton video={video} maxPage={4} />
      </SharedMediaCurrentPageProvider>,
    );

    userEvent.click(screen.getByTestId('pip-next-button'));
    expect(mockedNavigateSharingDoc).toHaveBeenCalledWith(video, 3);
  });

  it('disable the button on last page', () => {
    const video = videoMockFactory();

    render(
      <SharedMediaCurrentPageProvider value={{ page: 2, imageUrl: 'some url' }}>
        <NextPageButton video={video} maxPage={2} />
      </SharedMediaCurrentPageProvider>,
    );

    expect(screen.getByTestId('pip-next-button')).toBeDisabled();
  });
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { videoMockFactory } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { navigateSharingDoc } from 'api/navigateSharingDoc';
import { SharedMediaCurrentPageProvider } from 'hooks/useSharedMediaCurrentPage';
import { wrapInVideo } from 'utils/wrapInVideo';

import { NextPageButton } from '.';

jest.mock('api/navigateSharingDoc', () => ({
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
      wrapInVideo(
        <SharedMediaCurrentPageProvider
          value={{ page: 2, imageUrl: 'some url' }}
        >
          <NextPageButton maxPage={4} />
        </SharedMediaCurrentPageProvider>,
        video,
      ),
    );

    userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(mockedNavigateSharingDoc).toHaveBeenCalledWith(video, 3);
  });

  it('disable the button on last page', () => {
    const video = videoMockFactory();

    render(
      wrapInVideo(
        <SharedMediaCurrentPageProvider
          value={{ page: 2, imageUrl: 'some url' }}
        >
          <NextPageButton maxPage={2} />
        </SharedMediaCurrentPageProvider>,
        video,
      ),
    );

    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });
});

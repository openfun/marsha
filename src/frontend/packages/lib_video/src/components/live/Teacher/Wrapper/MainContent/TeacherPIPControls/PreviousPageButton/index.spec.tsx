import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';

import { navigateSharingDoc } from '@lib-video/api/navigateSharingDoc';
import { SharedMediaCurrentPageProvider } from '@lib-video/hooks/useSharedMediaCurrentPage';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { PreviousPageButton } from '.';

jest.mock('api/navigateSharingDoc', () => ({
  navigateSharingDoc: jest.fn(),
}));
const mockedNavigateSharingDoc = navigateSharingDoc as jest.MockedFunction<
  typeof navigateSharingDoc
>;

describe('<PreviousPageButton />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the button', async () => {
    const video = videoMockFactory();

    render(
      wrapInVideo(
        <SharedMediaCurrentPageProvider
          value={{ page: 2, imageUrl: 'some url' }}
        >
          <PreviousPageButton />
        </SharedMediaCurrentPageProvider>,
        video,
      ),
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Previous page' }),
    );
    expect(mockedNavigateSharingDoc).toHaveBeenCalledWith(video, 1);
  });

  it('disable the button on first page', () => {
    const video = videoMockFactory();

    render(
      wrapInVideo(
        <SharedMediaCurrentPageProvider
          value={{ page: 1, imageUrl: 'some url' }}
        >
          <PreviousPageButton />
        </SharedMediaCurrentPageProvider>,
        video,
      ),
    );

    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled();
  });
});

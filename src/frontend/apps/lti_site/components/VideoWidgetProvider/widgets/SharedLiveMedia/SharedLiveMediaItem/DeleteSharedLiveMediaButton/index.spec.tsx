import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sharedLiveMediaMockFactory } from 'lib-components';
import React, { PropsWithChildren } from 'react';

import { DeleteSharedLiveMediaModalProvider } from 'data/stores/useDeleteSharedLiveMediaModal';
import render from 'utils/tests/render';
import { DeleteSharedLiveMediaButton } from '.';

const mockSetDeleteSharedLiveMediaModal = jest.fn();
jest.mock('data/stores/useDeleteSharedLiveMediaModal', () => ({
  useDeleteSharedLiveMediaModal: () => [{}, mockSetDeleteSharedLiveMediaModal],
  DeleteSharedLiveMediaModalProvider: ({ children }: PropsWithChildren<{}>) =>
    children,
}));

describe('<DeleteButton />', () => {
  it('clicks on the button', () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory();

    render(
      <DeleteSharedLiveMediaModalProvider value={null}>
        <DeleteSharedLiveMediaButton sharedLiveMedia={mockedSharedLiveMedia} />
      </DeleteSharedLiveMediaModalProvider>,
    );

    const deleteButton = screen.getByRole('button', {
      name: 'Click on this button to delete the media.',
    });
    userEvent.click(deleteButton);

    expect(mockSetDeleteSharedLiveMediaModal).toHaveBeenCalledTimes(1);
    expect(mockSetDeleteSharedLiveMediaModal).toHaveBeenCalledWith(
      mockedSharedLiveMedia,
    );
  });
});

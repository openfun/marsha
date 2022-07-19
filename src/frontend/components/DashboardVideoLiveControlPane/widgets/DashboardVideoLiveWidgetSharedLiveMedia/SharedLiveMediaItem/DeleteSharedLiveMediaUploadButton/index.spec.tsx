import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { PropsWithChildren } from 'react';

import { DeleteSharedLiveMediaUploadModalProvider } from 'data/stores/useDeleteSharedLiveMediaUploadModal';
import { sharedLiveMediaMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { DeleteSharedLiveMediaUploadButton } from '.';

const mockSetDeleteSharedLiveMediaUploadModal = jest.fn();
jest.mock('data/stores/useDeleteSharedLiveMediaUploadModal', () => ({
  useDeleteSharedLiveMediaUploadModal: () => [
    {},
    mockSetDeleteSharedLiveMediaUploadModal,
  ],
  DeleteSharedLiveMediaUploadModalProvider: ({
    children,
  }: PropsWithChildren<{}>) => children,
}));

describe('<DeleteUploadButton />', () => {
  it('clicks on the button', () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory();

    render(
      <DeleteSharedLiveMediaUploadModalProvider value={null}>
        <DeleteSharedLiveMediaUploadButton
          sharedLiveMedia={mockedSharedLiveMedia}
        />
      </DeleteSharedLiveMediaUploadModalProvider>,
    );

    const deleteUploadButton = screen.getByRole('button', {
      name: 'Click on this button to delete the media.',
    });
    userEvent.click(deleteUploadButton);

    expect(mockSetDeleteSharedLiveMediaUploadModal).toHaveBeenCalledTimes(1);
    expect(mockSetDeleteSharedLiveMediaUploadModal).toHaveBeenCalledWith(
      mockedSharedLiveMedia,
    );
  });
});

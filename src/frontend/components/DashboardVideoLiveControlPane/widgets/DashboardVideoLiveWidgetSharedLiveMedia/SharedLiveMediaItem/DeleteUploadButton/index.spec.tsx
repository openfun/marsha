import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { PropsWithChildren } from 'react';

import { DeleteUploadModalProvider } from 'data/stores/useDeleteUploadModal';
import { sharedLiveMediaMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { DeleteUploadButton } from '.';

const mockSetDeleteUploadModal = jest.fn();
jest.mock('data/stores/useDeleteUploadModal', () => ({
  useDeleteUploadModal: () => [{}, mockSetDeleteUploadModal],
  DeleteUploadModalProvider: ({ children }: PropsWithChildren<{}>) => children,
}));

describe('<DeleteUploadButton />', () => {
  it('clicks on the button', () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory();

    render(
      wrapInIntlProvider(
        <DeleteUploadModalProvider value={null}>
          <DeleteUploadButton sharedLiveMedia={mockedSharedLiveMedia} />,
        </DeleteUploadModalProvider>,
      ),
    );

    const deleteUploadButton = screen.getByRole('button', {
      name: 'Click on this button to delete the media.',
    });
    userEvent.click(deleteUploadButton);

    expect(mockSetDeleteUploadModal).toHaveBeenCalledTimes(1);
    expect(mockSetDeleteUploadModal).toHaveBeenCalledWith(
      mockedSharedLiveMedia,
    );
  });
});

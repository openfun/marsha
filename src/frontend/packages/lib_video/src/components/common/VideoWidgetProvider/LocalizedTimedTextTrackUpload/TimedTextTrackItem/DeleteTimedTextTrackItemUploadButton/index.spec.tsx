import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { timedTextMockFactory } from 'lib-components';
import { render } from 'lib-tests';
import React, { PropsWithChildren } from 'react';

import { DeleteTimedTextTrackUploadModalProvider } from 'hooks/useDeleteTimedTextTrackUploadModal';

import { DeleteTimedTextTrackItemUploadButton } from '.';

const mockSetDeleteTimedTextTrackUploadModal = jest.fn();
jest.mock('hooks/useDeleteTimedTextTrackUploadModal', () => ({
  useDeleteTimedTextTrackUploadModal: () => [
    {},
    mockSetDeleteTimedTextTrackUploadModal,
  ],
  DeleteTimedTextTrackUploadModalProvider: ({
    children,
  }: PropsWithChildren<{}>) => children,
}));

describe('<DeleteTimedTextTrackUploadButton />', () => {
  it('clicks on the button', () => {
    const mockedTimedTextTrack = timedTextMockFactory();

    render(
      <DeleteTimedTextTrackUploadModalProvider value={null}>
        <DeleteTimedTextTrackItemUploadButton
          timedTextTrack={mockedTimedTextTrack}
        />
      </DeleteTimedTextTrackUploadModalProvider>,
    );

    const deleteTimedTextTrackUploadButton = screen.getByRole('button', {
      name: 'Click on this button to delete the timed text track.',
    });
    userEvent.click(deleteTimedTextTrackUploadButton);

    expect(mockSetDeleteTimedTextTrackUploadModal).toHaveBeenCalledTimes(1);
    expect(mockSetDeleteTimedTextTrackUploadModal).toHaveBeenCalledWith(
      mockedTimedTextTrack,
    );
  });
});

import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';

import { useDeleteSharedLiveMediaUploadModal } from 'data/stores/useDeleteSharedLiveMediaUploadModal/index';
import { useSharedLiveMedia } from 'data/stores/useSharedLiveMedia';
import { report } from 'utils/errors/report';
import { sharedLiveMediaMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { SharedLiveMediaModalWrapper } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'json web token',
  },
}));

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

jest.mock('data/stores/useDeleteSharedLiveMediaUploadModal', () => ({
  useDeleteSharedLiveMediaUploadModal: jest.fn(),
}));

const mockUseDeleteSharedLiveMediaUploadModal =
  useDeleteSharedLiveMediaUploadModal as jest.MockedFunction<
    typeof useDeleteSharedLiveMediaUploadModal
  >;

describe('<SharedLiveMediaModalWrapper />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders nothing if there is no shared live media to delete', () => {
    mockUseDeleteSharedLiveMediaUploadModal.mockReturnValue([null, jest.fn()]);
    render(<SharedLiveMediaModalWrapper />);
    expect(screen.queryByText('Delete shared media')).toBe(null);
    expect(screen.queryByRole('button', { name: 'Confirm' })).toBe(null);
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBe(null);
  });

  it('renders the modal when there is a shared live media to delete, and clicks on cancel', async () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory();
    const mockSetDeleteSharedLiveMediaUploadModal = jest.fn();
    mockUseDeleteSharedLiveMediaUploadModal.mockReturnValue([
      mockedSharedLiveMedia,
      mockSetDeleteSharedLiveMediaUploadModal,
    ]);
    render(<SharedLiveMediaModalWrapper />);
    screen.getByText('Delete shared media');
    screen.getByText(
      `Are you sure you want to delete file ${mockedSharedLiveMedia.title} ?`,
    );
    screen.getByRole('button', { name: 'Confirm' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    act(() => userEvent.click(cancelButton));
    expect(mockSetDeleteSharedLiveMediaUploadModal).toHaveBeenCalledTimes(1);
    expect(mockSetDeleteSharedLiveMediaUploadModal).toHaveBeenCalledWith(null);
  });

  it('renders the modal when there is a shared live media to delete, and clicks on confirm', async () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory();
    mockUseDeleteSharedLiveMediaUploadModal.mockReturnValue([
      mockedSharedLiveMedia,
      jest.fn(),
    ]);
    fetchMock.delete(`/api/sharedlivemedias/${mockedSharedLiveMedia.id}/`, 204);
    const mockRemoveResource = jest.fn();
    useSharedLiveMedia.getState().removeResource = mockRemoveResource;

    render(<SharedLiveMediaModalWrapper />);
    screen.getByText('Delete shared media');
    screen.getByText(
      `Are you sure you want to delete file ${mockedSharedLiveMedia.title} ?`,
    );
    screen.getByRole('button', { name: 'Cancel' });
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    act(() => userEvent.click(confirmButton));
    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
      ),
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });
    screen.getByText('Shared media updated.');
    expect(mockRemoveResource).toHaveBeenCalledWith(mockedSharedLiveMedia);
    expect(report).not.toHaveBeenCalled();
  });

  it('renders the modal when there is a shared live media to delete, and clicks on confirm, but it fails', async () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory();
    mockUseDeleteSharedLiveMediaUploadModal.mockReturnValue([
      mockedSharedLiveMedia,
      jest.fn(),
    ]);
    fetchMock.delete(`/api/sharedlivemedias/${mockedSharedLiveMedia.id}/`, 500);
    const mockRemoveResource = jest.fn();
    useSharedLiveMedia.getState().removeResource = mockRemoveResource;

    render(<SharedLiveMediaModalWrapper />);
    screen.getByText('Delete shared media');
    screen.getByText(
      `Are you sure you want to delete file ${mockedSharedLiveMedia.title} ?`,
    );
    screen.getByRole('button', { name: 'Cancel' });
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    act(() => userEvent.click(confirmButton));
    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/sharedlivemedias/${mockedSharedLiveMedia.id}/`,
      ),
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });
    screen.getByText('Shared media update has failed !');
    expect(mockRemoveResource).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalled();
  });
});

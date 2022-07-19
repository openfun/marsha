import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';

import { useDeleteSharedLiveMediaModal } from 'data/stores/useDeleteSharedLiveMediaModal';
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

jest.mock('data/stores/useDeleteSharedLiveMediaModal', () => ({
  useDeleteSharedLiveMediaModal: jest.fn(),
}));

const mockUseDeleteSharedLiveMediaModal =
  useDeleteSharedLiveMediaModal as jest.MockedFunction<
    typeof useDeleteSharedLiveMediaModal
  >;

describe('<SharedLiveMediaModalWrapper />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders nothing if there is no shared live media to delete', () => {
    mockUseDeleteSharedLiveMediaModal.mockReturnValue([null, jest.fn()]);
    render(<SharedLiveMediaModalWrapper />);
    expect(screen.queryByText('Delete shared media')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Confirm' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancel' }),
    ).not.toBeInTheDocument();
  });

  it('renders the modal when there is a shared live media to delete, and clicks on cancel', async () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory();
    const mockSetDeleteSharedLiveMediaModal = jest.fn();
    mockUseDeleteSharedLiveMediaModal.mockReturnValue([
      mockedSharedLiveMedia,
      mockSetDeleteSharedLiveMediaModal,
    ]);
    render(<SharedLiveMediaModalWrapper />);
    screen.getByText('Delete shared media');
    screen.getByText(
      `Are you sure you want to delete file ${mockedSharedLiveMedia.title} ?`,
    );
    screen.getByRole('button', { name: 'Confirm' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    act(() => userEvent.click(cancelButton));
    expect(mockSetDeleteSharedLiveMediaModal).toHaveBeenCalledTimes(1);
    expect(mockSetDeleteSharedLiveMediaModal).toHaveBeenCalledWith(null);
  });

  it('renders the modal when there is a shared live media to delete, and clicks on confirm', async () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory();
    mockUseDeleteSharedLiveMediaModal.mockReturnValue([
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
    screen.getByText('Shared media deleted.');
    expect(mockRemoveResource).toHaveBeenCalledWith(mockedSharedLiveMedia);
    expect(report).not.toHaveBeenCalled();
  });

  it('renders the modal when there is a shared live media to delete, and clicks on confirm, but it fails', async () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory();
    mockUseDeleteSharedLiveMediaModal.mockReturnValue([
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
    screen.getByText('Shared media deletion has failed !');
    expect(mockRemoveResource).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalled();
  });
});

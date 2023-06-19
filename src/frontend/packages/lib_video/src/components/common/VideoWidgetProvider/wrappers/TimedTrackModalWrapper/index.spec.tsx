import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  report,
  timedTextMockFactory,
  useJwt,
  useTimedTextTrack,
} from 'lib-components';
import { render } from 'lib-tests';

import { useDeleteTimedTextTrackUploadModal } from '@lib-video/hooks/useDeleteTimedTextTrackUploadModal';

import { TimedTrackModalWrapper } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

jest.mock('hooks/useDeleteTimedTextTrackUploadModal', () => ({
  useDeleteTimedTextTrackUploadModal: jest.fn(),
}));

const mockUseDeleteTimedTextTrackUploadModal =
  useDeleteTimedTextTrackUploadModal as jest.MockedFunction<
    typeof useDeleteTimedTextTrackUploadModal
  >;

describe('<TimedTrackModalWrapper />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
    jest.resetAllMocks();
  });

  it('renders nothing if there is no timed text track to delete', () => {
    mockUseDeleteTimedTextTrackUploadModal.mockReturnValue([null, jest.fn()]);
    render(<TimedTrackModalWrapper />);
    expect(
      screen.queryByText('Delete timed text track'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Confirm' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancel' }),
    ).not.toBeInTheDocument();
  });

  it('renders the modal when there is a timed text track to delete, and clicks on cancel', async () => {
    const mockedTimedTextTrack = timedTextMockFactory();
    const mockSetDeleteTimedTextTrackUploadModal = jest.fn();
    mockUseDeleteTimedTextTrackUploadModal.mockReturnValue([
      mockedTimedTextTrack,
      mockSetDeleteTimedTextTrackUploadModal,
    ]);
    render(<TimedTrackModalWrapper />);
    screen.getByText('Delete timed text track');
    screen.getByText(
      `Are you sure you want to delete file ${mockedTimedTextTrack.title} ?`,
    );
    screen.getByRole('button', { name: 'Confirm' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    await userEvent.click(cancelButton);

    expect(mockSetDeleteTimedTextTrackUploadModal).toHaveBeenCalledTimes(1);
    expect(mockSetDeleteTimedTextTrackUploadModal).toHaveBeenCalledWith(null);
  });

  it('renders the modal when there is a timed text track to delete, and clicks on confirm', async () => {
    const mockedTimedTextTrack = timedTextMockFactory();
    mockUseDeleteTimedTextTrackUploadModal.mockReturnValue([
      mockedTimedTextTrack,
      jest.fn(),
    ]);
    fetchMock.delete(
      `/api/videos/${mockedTimedTextTrack.video}/timedtexttracks/${mockedTimedTextTrack.id}/`,
      204,
    );
    const mockRemoveResource = jest.fn();
    useTimedTextTrack.getState().removeResource = mockRemoveResource;

    render(<TimedTrackModalWrapper />);
    screen.getByText('Delete timed text track');
    screen.getByText(
      `Are you sure you want to delete file ${mockedTimedTextTrack.title} ?`,
    );
    screen.getByRole('button', { name: 'Cancel' });
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });

    await userEvent.click(confirmButton);

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${mockedTimedTextTrack.video}/timedtexttracks/${mockedTimedTextTrack.id}/`,
      ),
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });
    screen.getByText('Timed text track updated.');
    expect(mockRemoveResource).toHaveBeenCalledWith(mockedTimedTextTrack);
    expect(report).not.toHaveBeenCalled();
  });

  it('renders the modal when there is a timed text track to delete, and clicks on confirm, but it fails', async () => {
    const mockedTimedTextTrack = timedTextMockFactory();
    mockUseDeleteTimedTextTrackUploadModal.mockReturnValue([
      mockedTimedTextTrack,
      jest.fn(),
    ]);
    fetchMock.delete(
      `/api/videos/${mockedTimedTextTrack.video}/timedtexttracks/${mockedTimedTextTrack.id}/`,
      500,
    );
    const mockRemoveResource = jest.fn();
    useTimedTextTrack.getState().removeResource = mockRemoveResource;

    render(<TimedTrackModalWrapper />);
    screen.getByText('Delete timed text track');
    screen.getByText(
      `Are you sure you want to delete file ${mockedTimedTextTrack.title} ?`,
    );
    screen.getByRole('button', { name: 'Cancel' });
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });

    await userEvent.click(confirmButton);

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/videos/${mockedTimedTextTrack.video}/timedtexttracks/${mockedTimedTextTrack.id}/`,
      ),
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });
    screen.getByText('Timed text track update has failed !');
    expect(mockRemoveResource).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalled();
  });
});

import userEvent from '@testing-library/user-event';
import { act, screen, waitFor } from '@testing-library/react';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import React, { PropsWithChildren } from 'react';

import {
  UploadManagerContext,
  UploadManagerStatus,
  useUploadManager,
} from 'components/UploadManager';
import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import { useThumbnail } from 'data/stores/useThumbnail';
import { modelName } from 'types/models';
import { uploadState } from 'types/tracks';
import { thumbnailMockFactory } from 'utils/tests/factories';

import { DashboardVideoLiveWidgetThumbnail } from '.';
import render from 'utils/tests/render';

jest.mock('components/UploadManager', () => ({
  useUploadManager: jest.fn(),
  UploadManagerContext: {
    Provider: ({ children }: PropsWithChildren<{}>) => children,
  },
  UploadManagerStatus: jest.requireActual('components/UploadManager')
    .UploadManagerStatus,
}));
const mockUseUploadManager = useUploadManager as jest.MockedFunction<
  typeof useUploadManager
>;

mockUseUploadManager.mockReturnValue({
  addUpload: jest.fn(),
  resetUpload: jest.fn(),
  uploadManagerState: {},
});

jest.mock('data/appData', () => ({
  appData: {
    static: {
      img: {
        liveBackground: 'path/to/image.png',
      },
    },
    jwt: 'json web token',
  },
}));

describe('<DashboardVideoLiveWidgetThumbnail />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('renders the component with default thumbnail', () => {
    render(
      <InfoWidgetModalProvider value={null}>
        <DashboardVideoLiveWidgetThumbnail />
      </InfoWidgetModalProvider>,
    );

    screen.getByText('Thumbnail');
    expect(
      screen.queryByRole('button', {
        name: 'Delete thumbnail',
      }),
    ).toEqual(null);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toEqual('path/to/image.png');
    screen.getByRole('button', { name: 'Upload an image' });
  });

  it('uploads a new image', async () => {
    const mockedThumbnail = {
      id: faker.datatype.uuid(),
      active_stamp: null,
      is_ready_to_show: false,
      upload_state: uploadState.PENDING,
      video: faker.datatype.uuid(),
    };
    const mockAddUpload = jest.fn();
    mockUseUploadManager.mockReturnValue({
      addUpload: mockAddUpload,
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    fetchMock.post('/api/thumbnails/', mockedThumbnail);

    render(
      <InfoWidgetModalProvider value={null}>
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <DashboardVideoLiveWidgetThumbnail />
        </UploadManagerContext.Provider>
      </InfoWidgetModalProvider>,
    );
    const uploadButton = screen.getByRole('button', {
      name: 'Upload an image',
    });
    userEvent.click(uploadButton);

    const hiddenInput = screen.getByTestId('input-file-test-id');
    const file = new File(['(⌐□_□)'], 'thumbnail.png', {
      type: 'image/*',
    });
    userEvent.upload(hiddenInput, file);

    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(`/api/thumbnails/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    await waitFor(() =>
      expect(useThumbnail.getState().thumbnails).toEqual({
        [mockedThumbnail.id]: mockedThumbnail,
      }),
    );
    expect(mockAddUpload).toHaveBeenCalledTimes(1);
    expect(mockAddUpload).toHaveBeenLastCalledWith(
      modelName.THUMBNAILS,
      mockedThumbnail.id,
      file,
    );
  });

  it('ensures upload state is reset when an upload is successful', async () => {
    const mockedThumbnail = thumbnailMockFactory({
      upload_state: uploadState.PENDING,
    });
    useThumbnail.getState().addResource(mockedThumbnail);
    const mockResetUpload = jest.fn();
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: mockResetUpload,
      uploadManagerState: {
        [mockedThumbnail.id]: {
          file: new File(['(⌐□_□)'], 'thumbnail.png', {
            type: 'image/*',
          }),
          objectType: modelName.THUMBNAILS,
          objectId: mockedThumbnail.id,
          progress: 100,
          status: UploadManagerStatus.SUCCESS,
        },
      },
    });

    render(
      <InfoWidgetModalProvider value={null}>
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <DashboardVideoLiveWidgetThumbnail />
        </UploadManagerContext.Provider>
      </InfoWidgetModalProvider>,
    );

    // Simulate an upload which just finished
    act(() =>
      useThumbnail
        .getState()
        .addResource({ ...mockedThumbnail, upload_state: uploadState.READY }),
    );

    expect(mockResetUpload).toBeCalledTimes(1);
    expect(mockResetUpload).toHaveBeenCalledWith(mockedThumbnail.id);
  });

  it('renders the component with an uploaded thumbnail', () => {
    const mockedThumbnail = thumbnailMockFactory({ is_ready_to_show: true });
    useThumbnail.getState().addResource(mockedThumbnail);
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    render(
      <InfoWidgetModalProvider value={null}>
        <DashboardVideoLiveWidgetThumbnail />
      </InfoWidgetModalProvider>,
    );
    const img = screen.getByRole('img', { name: 'Live video thumbnail' });
    expect(img.getAttribute('src')).toEqual(
      'https://example.com/default_thumbnail/144',
    );
    expect(img.getAttribute('srcset')).toEqual(
      'https://example.com/default_thumbnail/144 256w, https://example.com/default_thumbnail/240 426w, https://example.com/default_thumbnail/480 854w, https://example.com/default_thumbnail/720 1280w, https://example.com/default_thumbnail/1080 1920w',
    );
    screen.getByRole('button', { name: 'Delete thumbnail' });
    screen.getByRole('button', { name: 'Upload an image' });
  });

  it('deletes an uploaded thumbnail', async () => {
    const mockedThumbnail = thumbnailMockFactory({ is_ready_to_show: true });
    useThumbnail.getState().addResource(mockedThumbnail);
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    fetchMock.delete(`/api/thumbnails/${mockedThumbnail.id}/`, 204);

    render(
      <InfoWidgetModalProvider value={null}>
        <DashboardVideoLiveWidgetThumbnail />
      </InfoWidgetModalProvider>,
    );
    const removeButton = screen.getByRole('button', {
      name: 'Delete thumbnail',
    });
    act(() => userEvent.click(removeButton));

    const confirmButton = screen.getByRole('button', {
      name: 'Confirm',
    });
    act(() => userEvent.click(confirmButton));

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/thumbnails/${mockedThumbnail.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    });

    screen.getByText('Thumbnail successfully deleted.');
    expect(useThumbnail.getState().thumbnails).toEqual({});

    expect(
      screen.queryByRole('button', {
        name: 'Delete thumbnail',
      }),
    ).toEqual(null);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toEqual('path/to/image.png');
    expect(
      screen.queryByRole('button', {
        name: 'Delete thumbnail',
      }),
    ).toBeNull();
  });
});

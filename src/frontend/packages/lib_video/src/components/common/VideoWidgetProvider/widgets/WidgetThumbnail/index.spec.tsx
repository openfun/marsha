import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import {
  UploadManagerContext,
  UploadManagerStatus,
  useUploadManager,
  useJwt,
  thumbnailMockFactory,
  useThumbnail,
  modelName,
  uploadState,
} from 'lib-components';
import { render } from 'lib-tests';
import React, { PropsWithChildren } from 'react';

import { InfoWidgetModalProvider } from 'hooks/useInfoWidgetModal';

import { WidgetThumbnail } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useUploadManager: jest.fn(),
  UploadManagerContext: {
    Provider: ({ children }: PropsWithChildren<{}>) => children,
  },
  UploadManagerStatus: jest.requireActual('lib-components').UploadManagerStatus,
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'path/to/image.png',
      },
    },
  }),
}));

const mockUseUploadManager = useUploadManager as jest.MockedFunction<
  typeof useUploadManager
>;

mockUseUploadManager.mockReturnValue({
  addUpload: jest.fn(),
  resetUpload: jest.fn(),
  uploadManagerState: {},
});

const mockSetInfoWidgetModal = jest.fn();
jest.mock('hooks/useInfoWidgetModal', () => ({
  useInfoWidgetModal: () => [
    { isVisible: false, text: null, title: null },
    mockSetInfoWidgetModal,
  ],
  InfoWidgetModalProvider: ({ children }: PropsWithChildren<{}>) => children,
}));

describe('<DashboardLiveWidgetThumbnail />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('renders the component with default thumbnail', () => {
    render(
      <InfoWidgetModalProvider value={null}>
        <WidgetThumbnail />
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

    userEvent.click(screen.getByRole('button', { name: 'help' }));

    expect(mockSetInfoWidgetModal).toHaveBeenCalledWith({
      title: 'Thumbnail',
      text: 'This widget allows you to change the default thumbnail used for your live. The uploaded image should have a 16:9 ratio.',
      refWidget: expect.any(HTMLDivElement),
    });
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
          <WidgetThumbnail />
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

  it('ensures upload state is reset when an upload is successful', () => {
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
          <WidgetThumbnail />
        </UploadManagerContext.Provider>
      </InfoWidgetModalProvider>,
    );

    // Simulate an upload which just finished
    act(() =>
      useThumbnail
        .getState()
        .addResource({ ...mockedThumbnail, upload_state: uploadState.READY }),
    );

    expect(mockResetUpload).toHaveBeenCalledTimes(1);
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
        <WidgetThumbnail />
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
        <WidgetThumbnail />
      </InfoWidgetModalProvider>,
    );
    const removeButton = screen.getByRole('button', {
      name: 'Delete thumbnail',
    });

    userEvent.click(removeButton);

    const confirmButton = screen.getByRole('button', {
      name: 'Confirm',
    });

    userEvent.click(confirmButton);

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

  it('renders the component with default thumbnail in a VOD context', () => {
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    render(
      <InfoWidgetModalProvider value={null}>
        <WidgetThumbnail isLive={false} />
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

    userEvent.click(screen.getByRole('button', { name: 'help' }));

    expect(mockSetInfoWidgetModal).toHaveBeenCalledWith({
      title: 'Thumbnail',
      text: 'This widget allows you to change the default thumbnail used for your VOD. The uploaded image should have a 16:9 ratio.',
      refWidget: expect.any(HTMLDivElement),
    });
  });
});

import { screen } from '@testing-library/react';
import {
  UploadManagerState,
  UploadManagerStatus,
  modelName,
  thumbnailMockFactory,
  uploadState,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { ThumbnailManager } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({}),
}));

describe('<ThumbnailManager />', () => {
  it('renders the component for a failed upload', () => {
    const mockedThumbnail = thumbnailMockFactory({
      is_ready_to_show: false,
      upload_state: uploadState.ERROR,
      urls: undefined,
    });
    const mockedUploadState: UploadManagerState = {
      [mockedThumbnail.id]: {
        file: new File([], 'myThumbnail.png'),
        objectType: modelName.THUMBNAILS,
        objectId: mockedThumbnail.id,
        progress: 50,
        status: UploadManagerStatus.ERR_UPLOAD,
      },
    };
    render(
      <ThumbnailManager
        thumbnail={mockedThumbnail}
        uploadManagerState={mockedUploadState}
      />,
    );

    expect(
      screen.getByText(
        'An error happened while uploading your thumbnail. Please retry.',
      ),
    ).toBeInTheDocument();
  });

  it('renders the component for an uploading image', () => {
    const mockedThumbnail = thumbnailMockFactory({
      is_ready_to_show: false,
      upload_state: uploadState.PENDING,
      urls: undefined,
    });
    const mockedUploadState: UploadManagerState = {
      [mockedThumbnail.id]: {
        file: new File([], 'myThumbnail.png'),
        objectType: modelName.THUMBNAILS,
        objectId: mockedThumbnail.id,
        progress: 50,
        status: UploadManagerStatus.UPLOADING,
      },
    };
    render(
      <ThumbnailManager
        thumbnail={mockedThumbnail}
        uploadManagerState={mockedUploadState}
      />,
    );

    expect(
      screen.getByText('Your image is being uploaded (50/100).'),
    ).toBeInTheDocument();
  });

  it('renders the component for an image being processed', () => {
    const mockedThumbnail = thumbnailMockFactory({
      is_ready_to_show: false,
      upload_state: uploadState.PENDING,
      urls: undefined,
    });
    const mockedUploadState: UploadManagerState = {
      [mockedThumbnail.id]: {
        file: new File([], 'myThumbnail.png'),
        objectType: modelName.THUMBNAILS,
        objectId: mockedThumbnail.id,
        progress: 100,
        status: UploadManagerStatus.SUCCESS,
      },
    };
    render(
      <ThumbnailManager
        thumbnail={mockedThumbnail}
        uploadManagerState={mockedUploadState}
      />,
    );

    expect(
      screen.getByText('Your image is being processed.'),
    ).toBeInTheDocument();
  });

  it('renders the component for an image successfully uploaded', () => {
    const mockedThumbnail = thumbnailMockFactory({
      is_ready_to_show: true,
      upload_state: uploadState.READY,
    });
    const mockedUploadState: UploadManagerState = {
      [mockedThumbnail.id]: {
        file: new File([], 'myThumbnail.png'),
        objectType: modelName.THUMBNAILS,
        objectId: mockedThumbnail.id,
        progress: 100,
        status: UploadManagerStatus.SUCCESS,
      },
    };
    render(
      <ThumbnailManager
        thumbnail={mockedThumbnail}
        uploadManagerState={mockedUploadState}
      />,
    );

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toEqual(
      'https://example.com/default_thumbnail/144',
    );
    expect(img.getAttribute('srcset')).toEqual(
      'https://example.com/default_thumbnail/144 256w, https://example.com/default_thumbnail/240 426w, https://example.com/default_thumbnail/480 854w, https://example.com/default_thumbnail/720 1280w, https://example.com/default_thumbnail/1080 1920w',
    );
  });

  it('renders the component when upload has failed but page has been refreshed', () => {
    const mockedThumbnail = thumbnailMockFactory({
      is_ready_to_show: true,
      upload_state: uploadState.PENDING,
    });
    render(
      <ThumbnailManager thumbnail={mockedThumbnail} uploadManagerState={{}} />,
    );

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toEqual(
      'https://example.com/default_thumbnail/144',
    );
    expect(img.getAttribute('srcset')).toEqual(
      'https://example.com/default_thumbnail/144 256w, https://example.com/default_thumbnail/240 426w, https://example.com/default_thumbnail/480 854w, https://example.com/default_thumbnail/720 1280w, https://example.com/default_thumbnail/1080 1920w',
    );
  });
});

import { screen } from '@testing-library/react';
import { sharedLiveMediaMockFactory, uploadState } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { TitleDisplayer } from '.';

describe('<TitleDisplayer />', () => {
  it('renders the download upload link button when shared live media is still uploading', () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      upload_state: uploadState.PROCESSING,
      title: null,
    });
    render(
      <TitleDisplayer
        sharedLiveMedia={mockedSharedLiveMedia}
        uploadingTitle="uploading_title"
      />,
    );

    const downloadUploadLink = screen.getByRole('link', {
      name: 'uploading_title',
    });
    expect(downloadUploadLink).toHaveAttribute(
      'download',
      mockedSharedLiveMedia.filename,
    );
    expect(downloadUploadLink).toHaveAttribute(
      'href',
      mockedSharedLiveMedia.urls!.media,
    );
  });

  it('renders the download upload link button when shared live media has finished to upload', () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      upload_state: uploadState.READY,
    });
    render(
      <TitleDisplayer
        sharedLiveMedia={mockedSharedLiveMedia}
        uploadingTitle="uploading_title"
      />,
    );

    const downloadUploadLink = screen.getByRole('link', {
      name: mockedSharedLiveMedia.title!,
    });
    expect(downloadUploadLink).toHaveAttribute(
      'download',
      mockedSharedLiveMedia.filename,
    );
    expect(downloadUploadLink).toHaveAttribute(
      'href',
      mockedSharedLiveMedia.urls!.media,
    );
  });

  it('renders the download upload link button when shared live media upload has failed', () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      upload_state: uploadState.ERROR,
      urls: null,
      title: null,
      filename: null,
    });
    render(
      <TitleDisplayer
        sharedLiveMedia={mockedSharedLiveMedia}
        uploadingTitle={undefined}
      />,
    );

    const link = screen.getByRole('button', {
      name: 'Upload has failed',
    });
    expect(link).toBeInTheDocument();
    expect(link).toBeDisabled();
  });
});

import { render, screen } from '@testing-library/react';
import React from 'react';

import { sharedLiveMediaMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { uploadState } from 'types/tracks';
import { TitleDisplayer } from '.';

describe('<TitleDisplayer />', () => {
  it('renders the download upload link button when shared live media is still uploading', () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      upload_state: uploadState.PROCESSING,
      title: null,
    });
    render(
      wrapInIntlProvider(
        <TitleDisplayer
          sharedLiveMedia={mockedSharedLiveMedia}
          uploadingTitle="uploading_title"
        />,
      ),
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
    expect(downloadUploadLink).toHaveStyle('cursor: auto');
  });

  it('renders the download upload link button when shared live media has finished to upload', () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      upload_state: uploadState.READY,
    });
    render(
      wrapInIntlProvider(
        <TitleDisplayer
          sharedLiveMedia={mockedSharedLiveMedia}
          uploadingTitle="uploading_title"
        />,
      ),
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
    expect(downloadUploadLink).toHaveStyle('cursor: pointer');
  });

  it('renders the download upload link button when shared live media upload has failed', () => {
    const mockedSharedLiveMedia = sharedLiveMediaMockFactory({
      upload_state: uploadState.ERROR,
      urls: null,
      title: null,
      filename: null,
    });
    const { container } = render(
      wrapInIntlProvider(
        <TitleDisplayer
          sharedLiveMedia={mockedSharedLiveMedia}
          uploadingTitle={undefined}
        />,
      ),
    );

    screen.getByText('Upload has failed');
    const downloadUploadLink = container.getElementsByTagName('a')[0];
    expect(downloadUploadLink).not.toHaveAttribute('download');
    expect(downloadUploadLink).not.toHaveAttribute('href');
    expect(downloadUploadLink).toHaveStyle('cursor: auto');
  });
});

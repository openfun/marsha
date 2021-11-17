import { render, screen } from '@testing-library/react';
import React from 'react';

import { modelName } from '../../types/models';
import { uploadState } from '../../types/tracks';
import * as factories from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { UploadManagerContext, UploadManagerStatus } from '../UploadManager';
import { UploadableObjectStatusBadge } from '.';

jest.mock('../../data/appData', () => ({}));

describe('<UploadableObjectStatusBadge />', () => {
  it('shows the status for an object that is READY', () => {
    const object = factories.videoMockFactory({
      upload_state: uploadState.READY,
    });
    render(wrapInIntlProvider(<UploadableObjectStatusBadge object={object} />));

    screen.getByRole('status');
    screen.getByText('Ready');
  });

  it('shows the status for an object that is PROCESSING', () => {
    const object = factories.videoMockFactory({
      upload_state: uploadState.PROCESSING,
    });
    render(wrapInIntlProvider(<UploadableObjectStatusBadge object={object} />));

    screen.getByRole('status');
    screen.getByText('Processing');
  });

  it('shows the status for an object that is in ERROR', () => {
    const object = factories.videoMockFactory({
      upload_state: uploadState.ERROR,
    });
    render(wrapInIntlProvider(<UploadableObjectStatusBadge object={object} />));

    screen.getByRole('status');
    screen.getByText('Error');
  });

  it('shows the status for an object that is PENDING with no upload related information', () => {
    const object = factories.videoMockFactory({
      upload_state: uploadState.PENDING,
    });
    render(wrapInIntlProvider(<UploadableObjectStatusBadge object={object} />));

    screen.getByRole('status');
    screen.getByText('Pending');
  });

  it('shows the status for an object that is PENDING with an upload just starting', () => {
    const object = factories.videoMockFactory({
      upload_state: uploadState.PENDING,
    });

    const uploadManagerState = {
      [object.id]: {
        file: new File(['(⌐□_□)'], 'video.mp4'),
        objectId: object.id,
        objectType: modelName.VIDEOS,
        progress: 0,
        status: UploadManagerStatus.INIT,
      },
    };

    render(
      wrapInIntlProvider(
        <UploadManagerContext.Provider
          value={{ setUploadState: jest.fn(), uploadManagerState }}
        >
          <UploadableObjectStatusBadge object={object} />
        </UploadManagerContext.Provider>,
      ),
    );

    screen.getByRole('status');
    screen.getByText('Uploading');
  });

  it('shows the status for an object that is PENDING with an upload in progress', () => {
    const object = factories.videoMockFactory({
      upload_state: uploadState.PENDING,
    });

    const uploadManagerState = {
      [object.id]: {
        file: new File(['(⌐□_□)'], 'video.mp4'),
        objectId: object.id,
        objectType: modelName.VIDEOS,
        progress: 0,
        status: UploadManagerStatus.UPLOADING,
      },
    };

    render(
      wrapInIntlProvider(
        <UploadManagerContext.Provider
          value={{ setUploadState: jest.fn(), uploadManagerState }}
        >
          <UploadableObjectStatusBadge object={object} />
        </UploadManagerContext.Provider>,
      ),
    );

    screen.getByRole('status');
    screen.getByText('Uploading');
  });

  it('shows the status for an object that is PENDING with a failed upload (policy)', () => {
    const object = factories.videoMockFactory({
      upload_state: uploadState.PENDING,
    });

    const uploadManagerState = {
      [object.id]: {
        file: new File(['(⌐□_□)'], 'video.mp4'),
        objectId: object.id,
        objectType: modelName.VIDEOS,
        progress: 0,
        status: UploadManagerStatus.ERR_POLICY,
      },
    };

    render(
      wrapInIntlProvider(
        <UploadManagerContext.Provider
          value={{ setUploadState: jest.fn(), uploadManagerState }}
        >
          <UploadableObjectStatusBadge object={object} />
        </UploadManagerContext.Provider>,
      ),
    );

    screen.getByRole('status');
    screen.getByText('Error');
  });

  it('shows the status for an object that is PENDING with a failed upload (upload)', () => {
    const object = factories.videoMockFactory({
      upload_state: uploadState.PENDING,
    });

    const uploadManagerState = {
      [object.id]: {
        file: new File(['(⌐□_□)'], 'video.mp4'),
        objectId: object.id,
        objectType: modelName.VIDEOS,
        progress: 0,
        status: UploadManagerStatus.ERR_UPLOAD,
      },
    };

    render(
      wrapInIntlProvider(
        <UploadManagerContext.Provider
          value={{ setUploadState: jest.fn(), uploadManagerState }}
        >
          <UploadableObjectStatusBadge object={object} />
        </UploadManagerContext.Provider>,
      ),
    );

    screen.getByRole('status');
    screen.getByText('Error');
  });

  it('shows the status for an object that is PENDING with an upload that succeeded', () => {
    const object = factories.videoMockFactory({
      upload_state: uploadState.PENDING,
    });

    const uploadManagerState = {
      [object.id]: {
        file: new File(['(⌐□_□)'], 'video.mp4'),
        objectId: object.id,
        objectType: modelName.VIDEOS,
        progress: 0,
        status: UploadManagerStatus.SUCCESS,
      },
    };

    render(
      wrapInIntlProvider(
        <UploadManagerContext.Provider
          value={{ setUploadState: jest.fn(), uploadManagerState }}
        >
          <UploadableObjectStatusBadge object={object} />
        </UploadManagerContext.Provider>,
      ),
    );

    screen.getByRole('status');
    screen.getByText('Processing');
  });
});

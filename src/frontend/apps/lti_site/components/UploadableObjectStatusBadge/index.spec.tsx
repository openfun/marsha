import { screen } from '@testing-library/react';
import {
  UploadManagerContext,
  UploadManagerStatus,
  modelName,
  uploadState,
} from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import { UploadableObjectStatusBadge } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({}),
}));

describe('<UploadableObjectStatusBadge />', () => {
  it('shows the status for an object that is READY', () => {
    const object = videoMockFactory({
      upload_state: uploadState.READY,
    });
    render(<UploadableObjectStatusBadge object={object} />);

    screen.getByRole('status');
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('shows the status for an object that is PROCESSING', () => {
    const object = videoMockFactory({
      upload_state: uploadState.PROCESSING,
    });
    render(<UploadableObjectStatusBadge object={object} />);

    screen.getByRole('status');
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('shows the status for an object that is in ERROR', () => {
    const object = videoMockFactory({
      upload_state: uploadState.ERROR,
    });
    render(<UploadableObjectStatusBadge object={object} />);

    screen.getByRole('status');
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('shows the status for an object that is PENDING with no upload related information', () => {
    const object = videoMockFactory({
      upload_state: uploadState.PENDING,
    });
    render(<UploadableObjectStatusBadge object={object} />);

    screen.getByRole('status');
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows the status for an object that is PENDING with an upload just starting', () => {
    const object = videoMockFactory({
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
      <UploadManagerContext.Provider
        value={{ setUploadState: jest.fn(), uploadManagerState }}
      >
        <UploadableObjectStatusBadge object={object} />
      </UploadManagerContext.Provider>,
    );

    screen.getByRole('status');
    expect(screen.getByText('Uploading')).toBeInTheDocument();
  });

  it('shows the status for an object that is PENDING with an upload in progress', () => {
    const object = videoMockFactory({
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
      <UploadManagerContext.Provider
        value={{ setUploadState: jest.fn(), uploadManagerState }}
      >
        <UploadableObjectStatusBadge object={object} />
      </UploadManagerContext.Provider>,
    );

    screen.getByRole('status');
    expect(screen.getByText('Uploading')).toBeInTheDocument();
  });

  it('shows the status for an object that is PENDING with a failed upload (policy)', () => {
    const object = videoMockFactory({
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
      <UploadManagerContext.Provider
        value={{ setUploadState: jest.fn(), uploadManagerState }}
      >
        <UploadableObjectStatusBadge object={object} />
      </UploadManagerContext.Provider>,
    );

    screen.getByRole('status');
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('shows the status for an object that is PENDING with a failed upload (upload)', () => {
    const object = videoMockFactory({
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
      <UploadManagerContext.Provider
        value={{ setUploadState: jest.fn(), uploadManagerState }}
      >
        <UploadableObjectStatusBadge object={object} />
      </UploadManagerContext.Provider>,
    );

    screen.getByRole('status');
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('shows the status for an object that is PENDING with an upload that succeeded', () => {
    const object = videoMockFactory({
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
      <UploadManagerContext.Provider
        value={{ setUploadState: jest.fn(), uploadManagerState }}
      >
        <UploadableObjectStatusBadge object={object} />
      </UploadManagerContext.Provider>,
    );

    screen.getByRole('status');
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });
});

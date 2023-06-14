import { screen } from '@testing-library/react';
import React from 'react';

import {
  UploadManagerContext,
  UploadManagerStatus,
  modelName,
} from 'lib-components';
import { render } from 'lib-tests';

import { SidebarUploadsIndicator } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    static: {
      svg: {
        icons: '/path/to/icons.svg',
      },
    },
  }),
}));

describe('<SidebarUploadsIndicator />', () => {
  it('shows a link to the uploads view with a counter for the active downloads', () => {
    const { rerender } = render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: jest.fn(),
          uploadManagerState: {
            // Video 0 is over, videos 1 & 2 are ongoing
            ongoingVideo0: {
              file: new File(['(⌐□_□)'], 'video0.mp4'),
              objectId: 'video0',
              objectType: modelName.VIDEOS,
              progress: 100,
              status: UploadManagerStatus.SUCCESS,
            },
            ongoingVideo1: {
              file: new File(['(⌐□_□)'], 'video1.mp4'),
              objectId: 'video1',
              objectType: modelName.VIDEOS,
              progress: 80,
              status: UploadManagerStatus.UPLOADING,
            },
            ongoingVideo2: {
              file: new File(['(⌐□_□)'], 'video2.mp4'),
              objectId: 'video2',
              objectType: modelName.VIDEOS,
              progress: 20,
              status: UploadManagerStatus.UPLOADING,
            },
          },
        }}
      >
        <SidebarUploadsIndicator />
      </UploadManagerContext.Provider>,
    );

    screen.getByRole('link', { name: 'File uploads 2' });

    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: jest.fn(),
          uploadManagerState: {
            // Videos 0 & 1 are over, video 2 is ongoing
            ongoingVideo0: {
              file: new File(['(⌐□_□)'], 'video0.mp4'),
              objectId: 'video0',
              objectType: modelName.VIDEOS,
              progress: 100,
              status: UploadManagerStatus.SUCCESS,
            },
            ongoingVideo1: {
              file: new File(['(⌐□_□)'], 'video1.mp4'),
              objectId: 'video1',
              objectType: modelName.VIDEOS,
              progress: 100,
              status: UploadManagerStatus.SUCCESS,
            },
            ongoingVideo2: {
              file: new File(['(⌐□_□)'], 'video2.mp4'),
              objectId: 'video2',
              objectType: modelName.VIDEOS,
              progress: 20,
              status: UploadManagerStatus.UPLOADING,
            },
          },
        }}
      >
        <SidebarUploadsIndicator />
      </UploadManagerContext.Provider>,
    );

    screen.getByRole('link', { name: 'File uploads 1' });

    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: jest.fn(),
          uploadManagerState: {
            // Videos 0, 1 & 2 are all over, there is no ongoing upload
            ongoingVideo0: {
              file: new File(['(⌐□_□)'], 'video0.mp4'),
              objectId: 'video0',
              objectType: modelName.VIDEOS,
              progress: 100,
              status: UploadManagerStatus.SUCCESS,
            },
            ongoingVideo1: {
              file: new File(['(⌐□_□)'], 'video1.mp4'),
              objectId: 'video1',
              objectType: modelName.VIDEOS,
              progress: 100,
              status: UploadManagerStatus.SUCCESS,
            },
            ongoingVideo2: {
              file: new File(['(⌐□_□)'], 'video2.mp4'),
              objectId: 'video2',
              objectType: modelName.VIDEOS,
              progress: 100,
              status: UploadManagerStatus.SUCCESS,
            },
          },
        }}
      >
        <SidebarUploadsIndicator />
      </UploadManagerContext.Provider>,
    );

    screen.getByRole('link', { name: 'File uploads' });
  });
});

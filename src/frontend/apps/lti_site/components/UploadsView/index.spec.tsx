import { act, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  UploadManagerContext,
  UploadManagerStatus,
  modelName,
  videoMockFactory,
} from 'lib-components';
import { Deferred, render } from 'lib-tests';
import React from 'react';

import { UploadsView } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
}));

describe('<UploadsView />', () => {
  afterEach(() => fetchMock.restore());

  it('shows the list of ongoing and completed uploads', async () => {
    const video0 = videoMockFactory();
    const video0Deferred = new Deferred();
    fetchMock.get(`/api/videos/${video0.id}/`, video0Deferred.promise);
    const video1 = videoMockFactory();
    const video1Deferred = new Deferred();
    fetchMock.get(`/api/videos/${video1.id}/`, video1Deferred.promise);
    const video2 = videoMockFactory();
    const video2Deferred = new Deferred();
    fetchMock.get(`/api/videos/${video2.id}/`, video2Deferred.promise);

    render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: jest.fn(),
          uploadManagerState: {
            // Video 0 is over, videos 1 & 2 are ongoing
            [video0.id]: {
              file: new File(['(⌐□_□)'], 'video0.mp4'),
              objectId: video0.id,
              objectType: modelName.VIDEOS,
              progress: 100,
              status: UploadManagerStatus.SUCCESS,
            },
            [video1.id]: {
              file: new File(['(⌐□_□)'], 'video1.mp4'),
              objectId: video1.id,
              objectType: modelName.VIDEOS,
              progress: 80,
              status: UploadManagerStatus.UPLOADING,
            },
            [video2.id]: {
              file: new File(['(⌐□_□)'], 'video2.mp4'),
              objectId: video2.id,
              objectType: modelName.VIDEOS,
              progress: 20,
              status: UploadManagerStatus.UPLOADING,
            },
          },
        }}
      >
        <UploadsView />
      </UploadManagerContext.Provider>,
    );

    screen.getByRole('heading', { name: 'File uploads' });
    screen.getByText('video1.mp4');
    screen.getByText('video2.mp4');
    screen.getByRole('heading', { name: 'Completed uploads' });
    screen.getByText('video0.mp4');
    expect(screen.getAllByRole('list').length).toEqual(2);
    expect(screen.getAllByRole('listitem').length).toEqual(3);

    await act(async () => video0Deferred.resolve(video0));
    expect(screen.queryByText('video0.mp4')).toBeNull();
    screen.getByText(video0.title!);

    await act(async () => video1Deferred.resolve(video1));
    expect(screen.queryByText('video1.mp4')).toBeNull();
    screen.getByText(video1.title!);

    await act(async () => video2Deferred.resolve(video2));
    expect(screen.queryByText('video2.mp4')).toBeNull();
    screen.getByText(video2.title!);
  });

  it('shows relevant messages if there are no uploads', () => {
    render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: jest.fn(),
          // There are no uploads in progress nor completed ones
          uploadManagerState: {},
        }}
      >
        <UploadsView />
      </UploadManagerContext.Provider>,
    );

    screen.getByRole('heading', { name: 'File uploads' });
    screen.getByText('There are no ongoing file uploads.');
    expect(
      screen.queryByRole('heading', { name: 'Completed uploads' }),
    ).toBeNull();
    expect(screen.queryAllByRole('list').length).toEqual(0);
  });
});

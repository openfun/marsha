import { act, render } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import xhrMock, { MockResponse } from 'xhr-mock';

import { modelName } from '../../types/models';
import { Deferred } from '../../utils/tests/Deferred';
import { UploadManager, UploadManagerStatus, useUploadManager } from '.';

jest.mock('../../data/appData.ts', () => ({
  appData: {},
}));

describe('<UploadManager />', () => {
  let getLatestHookValues: () => any = () => {};

  const TestComponent = () => {
    const uploadManager = useUploadManager();
    getLatestHookValues = () => uploadManager;
    return null;
  };

  beforeEach(jest.resetAllMocks);
  beforeEach(() => xhrMock.setup());

  afterEach(() => fetchMock.restore());
  afterEach(() => xhrMock.teardown());

  it('gets the policy from the API and uses it to upload the file', async () => {
    const objectType = modelName.VIDEOS;
    const objectId = uuidv4();
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });

    const initiateUploadDeferred = new Deferred();
    const mockInitiateUpload = fetchMock.mock(
      `/api/videos/${objectId}/initiate-upload/`,
      initiateUploadDeferred.promise,
      { method: 'POST' },
    );

    const fileUploadDeferred = new Deferred<MockResponse>();
    xhrMock.post(
      'https://s3.aws.example.com/',
      () => fileUploadDeferred.promise,
    );

    render(
      <UploadManager>
        <TestComponent />
      </UploadManager>,
    );

    {
      const { addUpload, uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({});
      act(() => addUpload(objectType, objectId, file));
    }
    {
      const { uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType,
          file,
          progress: 0,
          status: UploadManagerStatus.INIT,
        },
      });
      expect(mockInitiateUpload.calls()).toHaveLength(1);
    }
    {
      await act(async () =>
        initiateUploadDeferred.resolve({
          fields: {
            key: 'foo',
          },
          url: 'https://s3.aws.example.com/',
        }),
      );
      const { uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType,
          file,
          progress: 0,
          status: UploadManagerStatus.UPLOADING,
        },
      });
    }
    {
      await act(async () =>
        fileUploadDeferred.resolve(
          new MockResponse().body('form data body').status(204),
        ),
      );
      const { uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType,
          file,
          progress: 0,
          status: UploadManagerStatus.SUCCESS,
        },
      });
    }
  });

  it('reports the error and does not upload to AWS when it fails to get the policy', async () => {
    const objectType = modelName.VIDEOS;
    const objectId = uuidv4();
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });

    const initiateUploadDeferred = new Deferred();
    const mockInitiateUpload = fetchMock.mock(
      `/api/videos/${objectId}/initiate-upload/`,
      initiateUploadDeferred.promise,
      {
        method: 'POST',
      },
    );

    xhrMock.post('https://s3.aws.example.com/', () => {
      throw new Error('upload file should not be called');
    });

    render(
      <UploadManager>
        <TestComponent />
      </UploadManager>,
    );

    {
      const { addUpload, uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({});
      act(() => addUpload(objectType, objectId, file));
    }
    {
      const { uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType,
          file,
          progress: 0,
          status: UploadManagerStatus.INIT,
        },
      });
      expect(mockInitiateUpload.calls()).toHaveLength(1);
    }
    {
      await act(async () => initiateUploadDeferred.resolve(400));
      const { uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType,
          file,
          progress: 0,
          status: UploadManagerStatus.ERR_POLICY,
        },
      });
    }
  });

  it('marks the object with an error state when it fails to upload the file', async () => {
    const objectType = modelName.VIDEOS;
    const objectId = uuidv4();
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });

    const initiateUploadDeferred = new Deferred();
    const mockInitiateUpload = fetchMock.mock(
      `/api/videos/${objectId}/initiate-upload/`,
      initiateUploadDeferred.promise,
      {
        method: 'POST',
      },
    );

    const fileUploadDeferred = new Deferred<MockResponse>();
    xhrMock.post(
      'https://s3.aws.example.com/',
      () => fileUploadDeferred.promise,
    );

    render(
      <UploadManager>
        <TestComponent />
      </UploadManager>,
    );

    {
      const { addUpload, uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({});
      act(() => addUpload(objectType, objectId, file));
    }
    {
      const { uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType,
          file,
          progress: 0,
          status: UploadManagerStatus.INIT,
        },
      });
      expect(mockInitiateUpload.calls()).toHaveLength(1);
    }
    {
      await act(async () =>
        initiateUploadDeferred.resolve({
          fields: {
            key: 'foo',
          },
          url: 'https://s3.aws.example.com/',
        }),
      );
      const { uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType,
          file,
          progress: 0,
          status: UploadManagerStatus.UPLOADING,
        },
      });
    }
    {
      await act(async () =>
        fileUploadDeferred.resolve(new MockResponse().status(400)),
      );
      const { uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType,
          file,
          progress: 0,
          status: UploadManagerStatus.ERR_UPLOAD,
        },
      });
    }
  });

  it('resets the state', async () => {
    const objectType = modelName.VIDEOS;
    const objectId = uuidv4();
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });

    const initiateUploadDeferred = new Deferred();
    const mockInitiateUpload = fetchMock.mock(
      `/api/videos/${objectId}/initiate-upload/`,
      initiateUploadDeferred.promise,
      { method: 'POST' },
    );

    const fileUploadDeferred = new Deferred<MockResponse>();
    xhrMock.post(
      'https://s3.aws.example.com/',
      () => fileUploadDeferred.promise,
    );

    render(
      <UploadManager>
        <TestComponent />
      </UploadManager>,
    );

    {
      const { addUpload, uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({});
      act(() => addUpload(objectType, objectId, file));
    }
    {
      const { uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType,
          file,
          progress: 0,
          status: UploadManagerStatus.INIT,
        },
      });
      expect(mockInitiateUpload.calls()).toHaveLength(1);
    }
    {
      await act(async () =>
        initiateUploadDeferred.resolve({
          fields: {
            key: 'foo',
          },
          url: 'https://s3.aws.example.com/',
        }),
      );
      const { uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType,
          file,
          progress: 0,
          status: UploadManagerStatus.UPLOADING,
        },
      });
    }
    {
      await act(async () =>
        fileUploadDeferred.resolve(
          new MockResponse().body('form data body').status(204),
        ),
      );
      const { uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType,
          file,
          progress: 0,
          status: UploadManagerStatus.SUCCESS,
        },
      });
    }
    {
      const { resetUpload } = getLatestHookValues();
      act(() => resetUpload(objectId));
    }
    {
      const { uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({});
    }
  });
});

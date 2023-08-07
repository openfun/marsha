import { act } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Deferred, render } from 'lib-tests';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import xhrMock, { MockResponse } from 'xhr-mock';

import { modelName } from '@lib-components/types/models';

import { UploadManager, UploadManagerStatus, useUploadManager } from '.';

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
      await act(async () => {
        initiateUploadDeferred.resolve({
          fields: {
            key: 'foo',
          },
          url: 'https://s3.aws.example.com/',
        });
        // We need to wait for the upload to complete before we can check the state
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
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
      await act(async () => {
        fileUploadDeferred.resolve(
          new MockResponse().body('form data body').status(204),
        );
        // We need to wait for the upload to complete before we can check the state
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
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

  it('uploads the file with a parent path', async () => {
    const objectType = modelName.THUMBNAILS;
    const objectId = uuidv4();
    const parentType = modelName.VIDEOS;
    const parentId = uuidv4();
    const file = new File(['(⌐□_□)'], 'course.jpg', { type: 'image/jpeg' });

    const initiateUploadDeferred = new Deferred();
    const mockInitiateUpload = fetchMock.mock(
      `/api/videos/${parentId}/thumbnails/${objectId}/initiate-upload/`,
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
      act(() => addUpload(objectType, objectId, file, parentType, parentId));
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
          parentType,
          parentId,
        },
      });
      expect(mockInitiateUpload.calls()).toHaveLength(1);
    }
    {
      await act(async () => {
        initiateUploadDeferred.resolve({
          fields: {
            key: 'foo',
          },
          url: 'https://s3.aws.example.com/',
        });
        // We need to wait for the upload to complete before we can check the state
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
      const { uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType,
          file,
          progress: 0,
          status: UploadManagerStatus.UPLOADING,
          parentType,
          parentId,
        },
      });
    }
    {
      await act(async () => {
        fileUploadDeferred.resolve(
          new MockResponse().body('form data body').status(204),
        );
        // We need to wait for the upload to complete before we can check the state
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
      const { uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType,
          file,
          progress: 0,
          status: UploadManagerStatus.SUCCESS,
          parentType,
          parentId,
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
      throw {
        type: 'ApiError',
        data: {
          message: `Failed to trigger initiate-upload on the API for ${objectType}/${objectId}.`,
        },
      };
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
      await act(async () => {
        initiateUploadDeferred.resolve(400);

        // We need to wait for the upload to complete before we can check the state
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
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

  it('Throws a size error if the API returns a File too large error', async () => {
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
      await act(async () => {
        initiateUploadDeferred.resolve(() => {
          throw {
            type: 'SizeError',
            data: {
              size: 'file too large, max size allowed is 1Gb',
            },
          };
        });

        // We need to wait for the upload to complete before we can check the state
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
      const { uploadManagerState } = getLatestHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType,
          file,
          progress: 0,
          status: UploadManagerStatus.ERR_SIZE,
          message: 'file too large, max size allowed is 1Gb',
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
      await act(async () => {
        initiateUploadDeferred.resolve({
          fields: {
            key: 'foo',
          },
          url: 'https://s3.aws.example.com/',
        });

        // We need to wait for the upload to complete before we can check the state
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
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
      await act(async () => {
        fileUploadDeferred.resolve(new MockResponse().status(400));

        // We need to wait for the upload to complete before we can check the state
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
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
      await act(async () => {
        initiateUploadDeferred.resolve({
          fields: {
            key: 'foo',
          },
          url: 'https://s3.aws.example.com/',
        });

        // We need to wait for the upload to complete before we can check the state
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
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
      await act(async () => {
        fileUploadDeferred.resolve(
          new MockResponse().body('form data body').status(204),
        );

        // We need to wait for the upload to complete before we can check the state
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
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

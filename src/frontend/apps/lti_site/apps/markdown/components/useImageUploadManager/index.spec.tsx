import { act, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { render, Deferred } from 'lib-tests';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import xhrMock, { MockResponse } from 'xhr-mock';

import { useImageUploadManager } from '.';
import {
  UploadManager,
  UploadManagerStatus,
  useUploadManager,
  MarkdownDocumentModelName as modelName,
  uploadState,
} from 'lib-components';
import { markdownImageMockFactory } from 'lib-markdown';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({}),
}));

describe('apps/markdown/components/useImageUploadManager', () => {
  let getLatestUseImageUploadManagerHookValues: () => any = () => {};
  let getLatestUseUploadManagerHookValues: () => any = () => {};
  const onImageUploadFinished = jest.fn();

  const TestComponent = () => {
    const uploadManager = useUploadManager();
    getLatestUseUploadManagerHookValues = () => uploadManager;

    const imageUploadManager = useImageUploadManager(onImageUploadFinished);
    getLatestUseImageUploadManagerHookValues = () => imageUploadManager;
    return null;
  };
  beforeEach(() => {
    jest.resetAllMocks();
    xhrMock.setup();
  });

  afterEach(() => {
    fetchMock.restore();
    xhrMock.teardown();
  });

  it('gets the policy from the API and uses it to upload the image', async () => {
    const objectId = uuidv4();
    const file = new File(['(⌐□_□)'], 'course.gif', { type: 'image/gif' });

    const initiateUploadDeferred = new Deferred();

    const mockcreateMarkdownImage = fetchMock.postOnce(
      `/api/markdown-images/`,
      markdownImageMockFactory({
        id: objectId,
        active_stamp: null,
        filename: null,
        is_ready_to_show: false,
        upload_state: uploadState.PENDING,
        url: null,
      }),
    );

    const mockInitiateUpload = fetchMock.postOnce(
      `/api/markdown-images/${objectId}/initiate-upload/`,
      initiateUploadDeferred.promise,
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
      const { addImageUpload } = getLatestUseImageUploadManagerHookValues();
      const { uploadManagerState } = getLatestUseUploadManagerHookValues();
      expect(uploadManagerState).toEqual({});
      await act(async () => await addImageUpload(file));
    }
    {
      const { uploadManagerState } = getLatestUseUploadManagerHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType: modelName.MARKDOWN_IMAGES,
          file,
          progress: 0,
          status: UploadManagerStatus.INIT,
        },
      });
      expect(
        mockInitiateUpload.calls(
          `/api/markdown-images/${objectId}/initiate-upload/`,
        ),
      ).toHaveLength(1);
      expect(
        mockcreateMarkdownImage.calls(`/api/markdown-images/`),
      ).toHaveLength(1);
    }
    {
      await act(async () => {
        initiateUploadDeferred.resolve({
          fields: {
            key: 'foo',
          },
          url: 'https://s3.aws.example.com/',
        });
      });
      const { uploadManagerState } = getLatestUseUploadManagerHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType: modelName.MARKDOWN_IMAGES,
          file,
          progress: 0,
          status: UploadManagerStatus.UPLOADING,
        },
      });
      expect(screen.getByRole('status')).toHaveTextContent('course.gif0%');
    }

    // When status will turn to SUCCESS the image polling will start
    fetchMock.get(
      `/api/markdown-images/${objectId}/`,
      markdownImageMockFactory({
        id: objectId,
        is_ready_to_show: false,
      }),
    );

    jest.useFakeTimers();
    {
      await act(async () => {
        fileUploadDeferred.resolve(
          new MockResponse().body('form data body').status(204),
        );
      });
      const { uploadManagerState } = getLatestUseUploadManagerHookValues();
      expect(uploadManagerState).toEqual({
        [objectId]: {
          objectId,
          objectType: modelName.MARKDOWN_IMAGES,
          file,
          progress: 0,
          status: UploadManagerStatus.SUCCESS,
        },
      });
      expect(screen.getByRole('status')).toHaveTextContent(
        'Processing course.gif',
      );
    }

    {
      await act(async () => {
        fetchMock.get(
          `/api/markdown-images/${objectId}/`,
          markdownImageMockFactory({
            id: objectId,
            is_ready_to_show: true,
          }),
          { overwriteRoutes: true },
        );
        jest.runOnlyPendingTimers();
      });
      await waitFor(() => expect(onImageUploadFinished).toHaveBeenCalled());
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(
          'Uploaded course.gif',
        );
      });
    }
    jest.useRealTimers();
  });
});

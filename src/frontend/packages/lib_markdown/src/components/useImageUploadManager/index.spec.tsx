import { act, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  UploadManager,
  UploadManagerStatus,
  MarkdownDocumentModelName as modelName,
  uploadState,
  useUploadManager,
} from 'lib-components';
import { Deferred, render } from 'lib-tests';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import xhrMock, { MockResponse } from 'xhr-mock';

import { markdownImageMockFactory } from '@lib-markdown/tests';

import { useImageUploadManager } from './index';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({}),
}));

describe('useImageUploadManager', () => {
  let getLatestUseImageUploadManagerHookValues: () => any = () => {};
  let getLatestUseUploadManagerHookValues: () => any = () => {};
  const markdownDocumentId = 'truc';
  const onImageUploadFinished = jest.fn();

  const TestComponent = () => {
    const uploadManager = useUploadManager();
    getLatestUseUploadManagerHookValues = () => uploadManager;

    const imageUploadManager = useImageUploadManager(
      markdownDocumentId,
      onImageUploadFinished,
    );
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

    const mockCreateMarkdownImage = fetchMock.postOnce(
      `/api/markdown-documents/${markdownDocumentId}/markdown-images/`,
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
      `/api/markdown-documents/${markdownDocumentId}/markdown-images/${objectId}/initiate-upload/`,
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
          parentId: markdownDocumentId,
        },
      });
      expect(
        mockInitiateUpload.calls(
          `/api/markdown-documents/${markdownDocumentId}/markdown-images/${objectId}/initiate-upload/`,
        ),
      ).toHaveLength(1);
      expect(
        mockCreateMarkdownImage.calls(
          `/api/markdown-documents/${markdownDocumentId}/markdown-images/`,
        ),
      ).toHaveLength(1);
    }
    {
      // eslint-disable-next-line @typescript-eslint/require-await
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
          parentId: markdownDocumentId,
        },
      });
      expect(screen.getByRole('status')).toHaveTextContent('course.gif0%');
    }

    // When status will turn to SUCCESS the image polling will start
    fetchMock.get(
      `/api/markdown-documents/${markdownDocumentId}/markdown-images/${objectId}/`,
      markdownImageMockFactory({
        id: objectId,
        is_ready_to_show: false,
      }),
    );

    jest.useFakeTimers();
    {
      // eslint-disable-next-line @typescript-eslint/require-await
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
          parentId: markdownDocumentId,
        },
      });
      expect(screen.getByRole('status')).toHaveTextContent(
        'Processing course.gif',
      );
    }

    {
      act(() => {
        fetchMock.get(
          `/api/markdown-documents/${markdownDocumentId}/markdown-images/${objectId}/`,
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

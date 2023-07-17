import { renderHook } from '@testing-library/react';
import {
  UploadManagerStatus,
  modelName,
  thumbnailMockFactory,
  uploadState,
} from 'lib-components';
import { wrapperUtils } from 'lib-tests';

import { useDetermineMessage } from './utils';

const genericThumbnail = thumbnailMockFactory();
const genericUploadManagerState = {
  [genericThumbnail.id]: {
    file: new File(['(⌐□_□)'], 'genericFile.png'),
    objectId: genericThumbnail.id,
    objectType: modelName.THUMBNAILS,
    progress: 50,
    status: UploadManagerStatus.UPLOADING,
  },
};

describe('DashboardLiveWidgetThumbnail/utils', () => {
  it('determineMessage when thumbnail upload has an error', () => {
    const thumbnailInError = {
      ...genericThumbnail,
      upload_state: uploadState.ERROR,
    };

    const { result } = renderHook(
      () => useDetermineMessage(thumbnailInError, genericUploadManagerState),
      {
        wrapper: wrapperUtils(),
      },
    );

    expect(result.current).toEqual(
      'An error happened while uploading your thumbnail. Please retry.',
    );
  });

  it('determineMessage when thumbnail is being uploaded', () => {
    const uploadingThumbnail = {
      ...genericThumbnail,
      upload_state: uploadState.PENDING,
    };
    const initializatingUploadManagerState = {
      [genericThumbnail.id]: {
        ...genericUploadManagerState[genericThumbnail.id],
        status: UploadManagerStatus.INIT,
      },
    };

    const { result: resultGeneric } = renderHook(
      () => useDetermineMessage(uploadingThumbnail, genericUploadManagerState),
      {
        wrapper: wrapperUtils(),
      },
    );

    expect(resultGeneric.current).toEqual(
      'Your image is being uploaded (50/100).',
    );

    const { result: resultInit } = renderHook(
      () =>
        useDetermineMessage(
          uploadingThumbnail,
          initializatingUploadManagerState,
        ),
      {
        wrapper: wrapperUtils(),
      },
    );

    expect(resultInit.current).toEqual(
      'Your image is being uploaded (50/100).',
    );
  });

  it('determineMessage when thumbnail is being processed', () => {
    const uploadingThumbnail = {
      ...genericThumbnail,
      upload_state: uploadState.PENDING,
    };
    const processedThumbnail = {
      ...genericThumbnail,
      upload_state: uploadState.PROCESSING,
    };
    const successfulUploadManagerState = {
      [genericThumbnail.id]: {
        ...genericUploadManagerState[genericThumbnail.id],
        status: UploadManagerStatus.SUCCESS,
      },
    };

    const { result: resultGeneric } = renderHook(
      () => useDetermineMessage(processedThumbnail, {}),
      {
        wrapper: wrapperUtils(),
      },
    );

    expect(resultGeneric.current).toEqual('Your image is being processed.');

    const { result: resultSuccess } = renderHook(
      () =>
        useDetermineMessage(uploadingThumbnail, successfulUploadManagerState),
      {
        wrapper: wrapperUtils(),
      },
    );

    expect(resultSuccess.current).toEqual('Your image is being processed.');
  });

  it('determineMessage when there is no message to return', () => {
    const { result } = renderHook(
      () => useDetermineMessage(genericThumbnail, {}),
      {
        wrapper: wrapperUtils(),
      },
    );

    expect(result.current).toEqual(null);

    const { result: resultSuccess } = renderHook(
      () =>
        useDetermineMessage(
          {
            ...genericThumbnail,
            upload_state: uploadState.READY,
          },
          {
            [genericThumbnail.id]: {
              ...genericUploadManagerState[genericThumbnail.id],
              status: UploadManagerStatus.SUCCESS,
            },
          },
        ),
      {
        wrapper: wrapperUtils(),
      },
    );

    expect(resultSuccess.current).toEqual(null);
  });
});

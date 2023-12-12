import { waitFor } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import { getResource as fetchResource } from '@lib-components/data/sideEffects/getResource';
import { updateResource } from '@lib-components/data/sideEffects/updateResource';
import {
  addResource,
  getStoreResource,
} from '@lib-components/data/stores/generics';
import { modelName } from '@lib-components/types/models';
import { Thumbnail, Video } from '@lib-components/types/tracks';

import { UploadHandlers } from './UploadHandlers';

import { UploadManagerContext, UploadManagerStatus } from '.';

jest.mock('data/sideEffects/updateResource', () => ({
  updateResource: jest.fn(),
}));

jest.mock('data/stores/generics', () => ({
  addResource: jest.fn(),
  getStoreResource: jest.fn(),
}));

jest.mock('data/sideEffects/getResource', () => ({
  getResource: jest.fn(),
}));

const mockAddResource = addResource as jest.MockedFunction<typeof addResource>;
const mockGetResource = getStoreResource as jest.MockedFunction<
  typeof getStoreResource
>;
const mockUpdateResource = updateResource as jest.MockedFunction<
  typeof updateResource
>;
const mockFetchResource = fetchResource as jest.MockedFunction<
  typeof fetchResource
>;

describe('<LTIUploadHandlers />', () => {
  const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
  const objectState = {
    file,
    objectId: uuidv4(),
    objectType: modelName.VIDEOS,
    progress: 0,
    status: UploadManagerStatus.UPLOADING,
  };
  const object = { id: objectState.objectId, title: '' } as Video;

  beforeEach(() => jest.resetAllMocks());

  it('updates the object name to the file name upon upload success', async () => {
    mockGetResource.mockReturnValue(object);

    const { rerender } = render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: { [objectState.objectId]: objectState },
        }}
      >
        <UploadHandlers />
      </UploadManagerContext.Provider>,
    );

    expect(mockAddResource).not.toHaveBeenCalled();
    expect(mockUpdateResource).not.toHaveBeenCalled();

    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {
            [objectState.objectId]: {
              ...objectState,
              status: UploadManagerStatus.SUCCESS,
            },
          },
        }}
      >
        <UploadHandlers />
      </UploadManagerContext.Provider>,
    );

    await waitFor(() => {
      expect(mockAddResource).toHaveBeenCalledWith(modelName.VIDEOS, {
        id: object.id,
        title: file.name,
      });
    });

    expect(mockUpdateResource).toHaveBeenCalledWith(
      {
        id: object.id,
        title: file.name,
      },
      modelName.VIDEOS,
      undefined,
    );
  });

  it('does not update the object name to the file when the object title is already set', () => {
    mockGetResource.mockReturnValue({
      ...object,
      title: 'title already present',
    });

    const { rerender } = render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: { [objectState.objectId]: objectState },
        }}
      >
        <UploadHandlers />
      </UploadManagerContext.Provider>,
    );

    expect(mockAddResource).not.toHaveBeenCalled();
    expect(mockUpdateResource).not.toHaveBeenCalled();

    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {
            [objectState.objectId]: {
              ...objectState,
              status: UploadManagerStatus.SUCCESS,
            },
          },
        }}
      >
        <UploadHandlers />
      </UploadManagerContext.Provider>,
    );

    expect(mockAddResource).not.toHaveBeenCalled();
    expect(mockUpdateResource).not.toHaveBeenCalled();
  });

  it('fetch the resource when the upload manager status is UPLOADING', async () => {
    mockFetchResource.mockResolvedValue(object);

    const { rerender } = render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {
            [objectState.objectId]: {
              ...objectState,
              status: UploadManagerStatus.INIT,
            },
          },
        }}
      >
        <UploadHandlers />
      </UploadManagerContext.Provider>,
    );

    expect(mockFetchResource).not.toHaveBeenCalled();

    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {
            [objectState.objectId]: {
              ...objectState,
              status: UploadManagerStatus.UPLOADING,
            },
          },
        }}
      >
        <UploadHandlers />
      </UploadManagerContext.Provider>,
    );

    await waitFor(() => {
      expect(mockFetchResource).toHaveBeenCalledWith(
        modelName.VIDEOS,
        object.id,
        undefined,
      );
    });
  });

  it('fetch the resource with parent resource', async () => {
    const image = new File(['(⌐□_□)'], 'course.jpg', { type: 'image/jpeg' });
    const thumbnailState = {
      file: image,
      objectId: uuidv4(),
      objectType: modelName.THUMBNAILS,
      progress: 0,
      status: UploadManagerStatus.UPLOADING,
      parentId: uuidv4(),
    };
    const thumbnail = { id: thumbnailState.objectId } as Thumbnail;
    mockFetchResource.mockResolvedValue(thumbnail);

    const { rerender } = render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {
            [thumbnailState.objectId]: {
              ...thumbnailState,
              status: UploadManagerStatus.INIT,
            },
          },
        }}
      >
        <UploadHandlers />
      </UploadManagerContext.Provider>,
    );

    expect(mockFetchResource).not.toHaveBeenCalled();

    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {
            [thumbnailState.objectId]: {
              ...thumbnailState,
              status: UploadManagerStatus.UPLOADING,
            },
          },
        }}
      >
        <UploadHandlers />
      </UploadManagerContext.Provider>,
    );

    await waitFor(() => {
      expect(mockFetchResource).toHaveBeenCalledWith(
        modelName.THUMBNAILS,
        thumbnail.id,
        thumbnailState.parentId,
      );
    });
  });

  it('does not do anything unless the upload manager status for the object becomes SUCCESS', () => {
    mockGetResource.mockReturnValue(object);

    const { rerender } = render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: { [objectState.objectId]: objectState },
        }}
      >
        <UploadHandlers />
      </UploadManagerContext.Provider>,
    );

    expect(mockAddResource).not.toHaveBeenCalled();
    expect(mockUpdateResource).not.toHaveBeenCalled();

    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {
            [objectState.objectId]: {
              ...objectState,
              status: UploadManagerStatus.ERR_UPLOAD,
            },
          },
        }}
      >
        <UploadHandlers />
      </UploadManagerContext.Provider>,
    );

    expect(mockAddResource).not.toHaveBeenCalled();
    expect(mockUpdateResource).not.toHaveBeenCalled();
  });

  it('does not do anything for objects which do not have a title', () => {
    mockGetResource.mockReturnValue({ id: object.id } as Thumbnail);

    const { rerender } = render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: { [objectState.objectId]: objectState },
        }}
      >
        <UploadHandlers />
      </UploadManagerContext.Provider>,
    );

    expect(mockAddResource).not.toHaveBeenCalled();
    expect(mockUpdateResource).not.toHaveBeenCalled();

    rerender(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {
            [objectState.objectId]: {
              ...objectState,
              status: UploadManagerStatus.SUCCESS,
            },
          },
        }}
      >
        <UploadHandlers />
      </UploadManagerContext.Provider>,
    );

    expect(mockAddResource).not.toHaveBeenCalled();
    expect(mockUpdateResource).not.toHaveBeenCalled();
  });
});

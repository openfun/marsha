import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import { updateResource } from '../../data/sideEffects/updateResource';
import { addResource, getResource } from '../../data/stores/generics';
import { modelName } from '../../types/models';
import { Thumbnail, Video } from '../../types/tracks';
import { LTIUploadHandlers } from './LTIUploadHandlers';
import { UploadManagerContext, UploadManagerStatus } from '.';

jest.mock('../../data/appData', () => ({}));
jest.mock('../../data/sideEffects/updateResource', () => ({
  updateResource: jest.fn(),
}));
jest.mock('../../data/stores/generics', () => ({
  addResource: jest.fn(),
  getResource: jest.fn(),
}));

const mockAddResource = addResource as jest.MockedFunction<typeof addResource>;
const mockGetResource = getResource as jest.MockedFunction<typeof getResource>;
const mockUpdateResource = updateResource as jest.MockedFunction<
  typeof updateResource
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
    mockGetResource.mockResolvedValue(object);

    const { rerender } = render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: { [objectState.objectId]: objectState },
        }}
      >
        <LTIUploadHandlers />
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
        <LTIUploadHandlers />
      </UploadManagerContext.Provider>,
    );

    await waitFor(() => {
      expect(mockAddResource).toHaveBeenCalledWith(modelName.VIDEOS, {
        id: object.id,
        title: file.name,
      });
      expect(mockUpdateResource).toHaveBeenCalledWith(
        {
          id: object.id,
          title: file.name,
        },
        modelName.VIDEOS,
      );
    });
  });

  it('does not do anything unless the upload manager status for the object becomes SUCCESS', () => {
    mockGetResource.mockResolvedValue(object);

    const { rerender } = render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: { [objectState.objectId]: objectState },
        }}
      >
        <LTIUploadHandlers />
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
        <LTIUploadHandlers />
      </UploadManagerContext.Provider>,
    );

    expect(mockAddResource).not.toHaveBeenCalled();
    expect(mockUpdateResource).not.toHaveBeenCalled();
  });

  it('does not do anything for objects which do not have a title', () => {
    mockGetResource.mockResolvedValue({ id: object.id } as Thumbnail);

    const { rerender } = render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: { [objectState.objectId]: objectState },
        }}
      >
        <LTIUploadHandlers />
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
        <LTIUploadHandlers />
      </UploadManagerContext.Provider>,
    );

    expect(mockAddResource).not.toHaveBeenCalled();
    expect(mockUpdateResource).not.toHaveBeenCalled();
  });
});

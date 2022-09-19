import { screen } from '@testing-library/react';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import {
  UploadManagerContext,
  UploadManagerStatus,
} from 'components/UploadManager';
import { modelName } from 'types/models';
import { liveState, UploadableObject, uploadState } from 'types/tracks';
import render from 'utils/tests/render';

import { ObjectStatusPicker } from '.';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({}),
}));

const { DELETED, INITIALIZED, ERROR, PENDING, PROCESSING, READY } = uploadState;
const {
  IDLE,
  RUNNING,
  STARTING,
  STOPPED,
  HARVESTED,
  HARVESTING,
  STOPPING,
  ENDED,
} = liveState;

describe('<ObjectStatusPicker />', () => {
  describe('upload state', () => {
    it('renders status info for an object currently PENDING', () => {
      const object = {
        id: uuidv4(),
        upload_state: PENDING,
      } as UploadableObject;

      render(
        <UploadManagerContext.Provider
          value={{ setUploadState: () => {}, uploadManagerState: {} }}
        >
          <ObjectStatusPicker object={object} />
        </UploadManagerContext.Provider>,
      );

      screen.getByText('Missing ❌');
    });

    it('renders status info for an object with an ongoing upload', () => {
      const object = {
        id: uuidv4(),
        upload_state: PENDING,
      } as UploadableObject;

      render(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {
              [object.id]: {
                file: new File(['(⌐□_□)'], 'course.mp4', {
                  type: 'video/mp4',
                }),
                objectId: object.id,
                objectType: modelName.VIDEOS,
                progress: 60,
                status: UploadManagerStatus.UPLOADING,
              },
            },
          }}
        >
          <ObjectStatusPicker object={object} />
        </UploadManagerContext.Provider>,
      );

      screen.getByText('Uploading');
    });

    it('renders status info for an object with a just-finished upload', () => {
      // State is still pending as the state info has not looped back from lambda => server => client,
      // however we know it should be processing as we just finished uploading it.
      const object = {
        id: uuidv4(),
        upload_state: PENDING,
      } as UploadableObject;

      render(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {
              [object.id]: {
                file: new File(['(⌐□_□)'], 'course.mp4', {
                  type: 'video/mp4',
                }),
                objectId: object.id,
                objectType: modelName.VIDEOS,
                progress: 100,
                status: UploadManagerStatus.SUCCESS,
              },
            },
          }}
        >
          <ObjectStatusPicker object={object} />
        </UploadManagerContext.Provider>,
      );

      screen.getByText('Processing');
    });

    it('renders status info for an object INITILIAZING', () => {
      // Here the object is not an upload that has just finished. However as we got it from the API,
      // the state on the object itself was "PROCESSING".
      const object = {
        id: uuidv4(),
        upload_state: INITIALIZED,
      } as UploadableObject;

      render(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <ObjectStatusPicker object={object} />
        </UploadManagerContext.Provider>,
      );

      screen.getByText('Initialized ✔️');
    });

    it('renders status info for an object undergoing PROCESSING', () => {
      // Here the object is not an upload that has just finished. However as we got it from the API,
      // the state on the object itself was "PROCESSING".
      const object = {
        id: uuidv4(),
        upload_state: PROCESSING,
      } as UploadableObject;

      render(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <ObjectStatusPicker object={object} />
        </UploadManagerContext.Provider>,
      );

      screen.getByText('Processing');
    });

    it('renders status info for an object in state READY', () => {
      const object = {
        id: uuidv4(),
        upload_state: READY,
      } as UploadableObject;

      render(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <ObjectStatusPicker object={object} />
        </UploadManagerContext.Provider>,
      );

      screen.getByText('Ready ✔️');
    });

    it('renders status info for an object in state ERROR', () => {
      const object = {
        id: uuidv4(),
        upload_state: ERROR,
      } as UploadableObject;

      render(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <ObjectStatusPicker object={object} />
        </UploadManagerContext.Provider>,
      );

      screen.getByText('Error ❌');
    });

    it('renders status info for an object in state DELETED', () => {
      const object = {
        id: uuidv4(),
        upload_state: DELETED,
      } as UploadableObject;

      render(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <ObjectStatusPicker object={object} />
        </UploadManagerContext.Provider>,
      );

      screen.getByText('Deleted ❌');
    });
  });

  describe('live state', () => {
    it('renders status info for an object in live state IDLE', () => {
      const object = {
        id: uuidv4(),
        live_state: IDLE,
        upload_state: PENDING,
      } as UploadableObject;

      render(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <ObjectStatusPicker object={object} />
        </UploadManagerContext.Provider>,
      );

      screen.getByText('Ready to start live');
    });

    it('renders status info for an object in live state STARTING', () => {
      const object = {
        id: uuidv4(),
        live_state: STARTING,
        upload_state: PENDING,
      } as UploadableObject;

      render(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <ObjectStatusPicker object={object} />
        </UploadManagerContext.Provider>,
      );

      screen.getByText('live Starting');
    });

    it('renders status info for an object in live state RUNNING', () => {
      const object = {
        id: uuidv4(),
        live_state: RUNNING,
        upload_state: PENDING,
      } as UploadableObject;

      render(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <ObjectStatusPicker object={object} />
        </UploadManagerContext.Provider>,
      );

      screen.getByText('Live is running');
    });

    it('renders status info for an object in live state STOPPED', () => {
      const object = {
        id: uuidv4(),
        live_state: STOPPED,
        upload_state: PENDING,
      } as UploadableObject;

      render(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <ObjectStatusPicker object={object} />
        </UploadManagerContext.Provider>,
      );

      screen.getByText('Live ended');
    });

    it('renders status info for an object in live state STOPPING', () => {
      const object = {
        id: uuidv4(),
        live_state: STOPPING,
        upload_state: PENDING,
      } as UploadableObject;

      render(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <ObjectStatusPicker object={object} />
        </UploadManagerContext.Provider>,
      );

      screen.getByText('Live is stopping');
    });

    it('renders status info for an object in live state HARVESTED', () => {
      const object = {
        id: uuidv4(),
        live_state: HARVESTED,
        upload_state: PENDING,
      } as UploadableObject;

      render(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <ObjectStatusPicker object={object} />
        </UploadManagerContext.Provider>,
      );

      screen.getByText('Waiting VOD publication');
    });

    it('renders status info for an object in live state HARVESTING', () => {
      const object = {
        id: uuidv4(),
        live_state: HARVESTING,
        upload_state: PENDING,
      } as UploadableObject;

      render(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <ObjectStatusPicker object={object} />
        </UploadManagerContext.Provider>,
      );

      screen.getByText('Transforming live in VOD');
    });

    it('renders status info for an object in live state ENDED', () => {
      const object = {
        id: uuidv4(),
        live_state: ENDED,
        upload_state: PENDING,
      } as UploadableObject;

      render(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {},
          }}
        >
          <ObjectStatusPicker object={object} />
        </UploadManagerContext.Provider>,
      );

      screen.getByText('Live has ended');
    });
  });
});

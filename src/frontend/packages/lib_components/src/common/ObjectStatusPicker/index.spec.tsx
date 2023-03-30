import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import { UploadManagerStatus } from '@lib-components/common/UploadManager';
import {
  liveState,
  UploadableObject,
  uploadState,
} from '@lib-components/types/tracks';

import { ObjectStatusPicker } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
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

      render(<ObjectStatusPicker object={object} />);

      expect(screen.getByText('Missing ❌')).toBeInTheDocument();
    });

    it('renders status info for an object with an ongoing upload', () => {
      const object = {
        id: uuidv4(),
        upload_state: PENDING,
      } as UploadableObject;

      render(
        <ObjectStatusPicker
          object={object}
          uploadStatus={UploadManagerStatus.UPLOADING}
        />,
      );

      expect(screen.getByText('Uploading')).toBeInTheDocument();
    });

    it('renders status info for an object with a just-finished upload', () => {
      // State is still pending as the state info has not looped back from lambda => server => client,
      // however we know it should be processing as we just finished uploading it.
      const object = {
        id: uuidv4(),
        upload_state: PENDING,
      } as UploadableObject;

      render(
        <ObjectStatusPicker
          object={object}
          uploadStatus={UploadManagerStatus.SUCCESS}
        />,
      );

      expect(screen.getByText('Processing')).toBeInTheDocument();
    });

    it('renders status info for an object INITILIAZING', () => {
      // Here the object is not an upload that has just finished. However as we got it from the API,
      // the state on the object itself was "PROCESSING".
      const object = {
        id: uuidv4(),
        upload_state: INITIALIZED,
      } as UploadableObject;

      render(<ObjectStatusPicker object={object} />);

      expect(screen.getByText('Initialized ✔️')).toBeInTheDocument();
    });

    it('renders status info for an object undergoing PROCESSING', () => {
      // Here the object is not an upload that has just finished. However as we got it from the API,
      // the state on the object itself was "PROCESSING".
      const object = {
        id: uuidv4(),
        upload_state: PROCESSING,
      } as UploadableObject;

      render(<ObjectStatusPicker object={object} />);

      expect(screen.getByText('Processing')).toBeInTheDocument();
    });

    it('renders status info for an object in state READY', () => {
      const object = {
        id: uuidv4(),
        upload_state: READY,
      } as UploadableObject;

      render(<ObjectStatusPicker object={object} />);

      expect(screen.getByText('Ready ✔️')).toBeInTheDocument();
    });

    it('renders status info for an object in state ERROR', () => {
      const object = {
        id: uuidv4(),
        upload_state: ERROR,
      } as UploadableObject;

      render(<ObjectStatusPicker object={object} />);

      expect(screen.getByText('Error ❌')).toBeInTheDocument();
    });

    it('renders status info for an object in state DELETED', () => {
      const object = {
        id: uuidv4(),
        upload_state: DELETED,
      } as UploadableObject;

      render(<ObjectStatusPicker object={object} />);

      expect(screen.getByText('Deleted ❌')).toBeInTheDocument();
    });
  });

  describe('live state', () => {
    it('renders status info for an object in live state IDLE', () => {
      const object = {
        id: uuidv4(),
        live_state: IDLE,
        upload_state: PENDING,
      } as UploadableObject;

      render(<ObjectStatusPicker object={object} />);

      expect(screen.getByText('Ready to start live')).toBeInTheDocument();
    });

    it('renders status info for an object in live state STARTING', () => {
      const object = {
        id: uuidv4(),
        live_state: STARTING,
        upload_state: PENDING,
      } as UploadableObject;

      render(<ObjectStatusPicker object={object} />);

      expect(screen.getByText('live Starting')).toBeInTheDocument();
    });

    it('renders status info for an object in live state RUNNING', () => {
      const object = {
        id: uuidv4(),
        live_state: RUNNING,
        upload_state: PENDING,
      } as UploadableObject;

      render(<ObjectStatusPicker object={object} />);

      expect(screen.getByText('Live is running')).toBeInTheDocument();
    });

    it('renders status info for an object in live state STOPPED', () => {
      const object = {
        id: uuidv4(),
        live_state: STOPPED,
        upload_state: PENDING,
      } as UploadableObject;

      render(<ObjectStatusPicker object={object} />);

      expect(screen.getByText('Live ended')).toBeInTheDocument();
    });

    it('renders status info for an object in live state STOPPING', () => {
      const object = {
        id: uuidv4(),
        live_state: STOPPING,
        upload_state: PENDING,
      } as UploadableObject;

      render(<ObjectStatusPicker object={object} />);

      expect(screen.getByText('Live is stopping')).toBeInTheDocument();
    });

    it('renders status info for an object in live state HARVESTED', () => {
      const object = {
        id: uuidv4(),
        live_state: HARVESTED,
        upload_state: PENDING,
      } as UploadableObject;

      render(<ObjectStatusPicker object={object} />);

      expect(screen.getByText('Waiting VOD publication')).toBeInTheDocument();
    });

    it('renders status info for an object in live state HARVESTING', () => {
      const object = {
        id: uuidv4(),
        live_state: HARVESTING,
        upload_state: PENDING,
      } as UploadableObject;

      render(<ObjectStatusPicker object={object} />);

      expect(screen.getByText('Transforming live in VOD')).toBeInTheDocument();
    });

    it('renders status info for an object in live state ENDED', () => {
      const object = {
        id: uuidv4(),
        live_state: ENDED,
        upload_state: PENDING,
      } as UploadableObject;

      render(<ObjectStatusPicker object={object} />);

      expect(screen.getByText('Live has ended')).toBeInTheDocument();
    });
  });
});

/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-node-access */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import {
  UploadManagerContext,
  UploadManagerStatus,
} from 'common/UploadManager';
import { modelName } from 'types/models';

import { UploadField } from '.';

describe('<UploadField />', () => {
  const objectType = modelName.VIDEOS;
  const objectId = uuidv4();

  it('renders a Dropzone with the relevant messages', () => {
    render(<UploadField {...{ objectId, objectType }} />);

    expect(screen.getByText('Select a file to upload')).toBeInTheDocument();
  });

  it('passes the file to the callback', async () => {
    const setUploadState = jest.fn();
    const { container } = render(
      <UploadManagerContext.Provider
        value={{ setUploadState, uploadManagerState: {} }}
      >
        <UploadField {...{ objectId, objectType }} />
      </UploadManagerContext.Provider>,
    );

    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });

    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: {
        files: [file],
      },
    });
    await waitFor(() => expect(setUploadState.mock.calls.length).toEqual(1));
    const stateSetter = setUploadState.mock.calls[0][0];
    expect(stateSetter({})).toEqual({
      [objectId]: {
        file,
        objectId,
        objectType,
        progress: 0,
        status: UploadManagerStatus.INIT,
      },
    });
  });
});

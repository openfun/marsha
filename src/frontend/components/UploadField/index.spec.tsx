import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import { modelName } from '../../types/models';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { UploadManagerContext, UploadManagerStatus } from '../UploadManager';
import { UploadField } from '.';

jest.mock('../../data/appData', () => ({}));

describe('<UploadField />', () => {
  const objectType = modelName.VIDEOS;
  const objectId = uuidv4();

  it('renders a Dropzone with the relevant messages', () => {
    render(wrapInIntlProvider(<UploadField {...{ objectId, objectType }} />));
    screen.getByText('Select a file to upload');
  });

  it('passes the file to the callback', async () => {
    const setUploadState = jest.fn();
    const { container } = render(
      <UploadManagerContext.Provider
        value={{ setUploadState, uploadManagerState: {} }}
      >
        {wrapInIntlProvider(<UploadField {...{ objectId, objectType }} />)}
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

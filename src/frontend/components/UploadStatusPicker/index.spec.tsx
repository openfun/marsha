import { render } from '@testing-library/react';
import React from 'react';

import { UploadStatusPicker } from '.';
import { uploadState } from '../../types/tracks';
import { wrapInIntlProvider } from '../../utils/tests/intl';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = uploadState;

describe('<UploadStatusPicker />', () => {
  it('renders the status list for PENDING', () => {
    const { getByText } = render(
      wrapInIntlProvider(<UploadStatusPicker state={PENDING} />),
    );

    getByText('Missing ❌');
  });

  it('renders the status list for UPLOADING', () => {
    const { getByText } = render(
      wrapInIntlProvider(<UploadStatusPicker state={UPLOADING} />),
    );

    getByText('Uploading');
  });

  it('renders the status list for PROCESSING', () => {
    const { getByText } = render(
      wrapInIntlProvider(<UploadStatusPicker state={PROCESSING} />),
    );

    getByText('Processing');
  });

  it('renders the status list for READY', () => {
    const { getByText } = render(
      wrapInIntlProvider(<UploadStatusPicker state={READY} />),
    );

    getByText('Ready ✔️');
  });

  it('renders the status list for ERROR', () => {
    const { getByText } = render(
      wrapInIntlProvider(<UploadStatusPicker state={ERROR} />),
    );

    getByText('Error ❌');
  });
});

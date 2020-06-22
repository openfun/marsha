import { render, screen } from '@testing-library/react';
import React from 'react';

import { UploadStatusPicker } from '.';
import { uploadState } from '../../types/tracks';
import { wrapInIntlProvider } from '../../utils/tests/intl';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = uploadState;

describe('<UploadStatusPicker />', () => {
  it('renders the status list for PENDING', () => {
    render(wrapInIntlProvider(<UploadStatusPicker state={PENDING} />));

    screen.getByText('Missing ❌');
  });

  it('renders the status list for UPLOADING', () => {
    const { getByText } = render(
      wrapInIntlProvider(<UploadStatusPicker state={UPLOADING} />),
    );

    getByText('Uploading');
  });

  it('renders the status list for PROCESSING', () => {
    render(wrapInIntlProvider(<UploadStatusPicker state={PROCESSING} />));

    screen.getByText('Processing');
  });

  it('renders the status list for READY', () => {
    render(wrapInIntlProvider(<UploadStatusPicker state={READY} />));

    screen.getByText('Ready ✔️');
  });

  it('renders the status list for ERROR', () => {
    render(wrapInIntlProvider(<UploadStatusPicker state={ERROR} />));

    screen.getByText('Error ❌');
  });
});

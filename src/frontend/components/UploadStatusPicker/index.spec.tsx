import { render } from '@testing-library/react';
import React from 'react';

import { UploadStatusPicker } from '.';
import { uploadState } from '../../types/tracks';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = uploadState;

describe('<UploadStatusPicker />', () => {
  it('renders the status list for PENDING', () => {
    const { getByText } = render(<UploadStatusPicker state={PENDING} />);

    getByText('Missing ❌');
  });

  it('renders the status list for UPLOADING', () => {
    const { getByText } = render(<UploadStatusPicker state={UPLOADING} />);

    getByText('Uploading');
  });

  it('renders the status list for PROCESSING', () => {
    const { getByText } = render(<UploadStatusPicker state={PROCESSING} />);

    getByText('Processing');
  });

  it('renders the status list for READY', () => {
    const { getByText } = render(<UploadStatusPicker state={READY} />);

    getByText('Ready ✔️');
  });

  it('renders the status list for ERROR', () => {
    const { getByText } = render(<UploadStatusPicker state={ERROR} />);

    getByText('Error ❌');
  });
});

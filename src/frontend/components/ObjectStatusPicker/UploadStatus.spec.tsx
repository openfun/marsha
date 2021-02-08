import { render, screen } from '@testing-library/react';
import React from 'react';

import { statusIconKey, UploadStatus } from './UploadStatus';

describe('<UploadStatus />', () => {
  it('renders with children', () => {
    render(<UploadStatus>Some child content</UploadStatus>);
    screen.getByText('Some child content');
  });

  it('displays the status icon ❌', () => {
    render(
      <UploadStatus statusIcon={statusIconKey.X}>
        Some child content
      </UploadStatus>,
    );
    screen.getByText('Some child content ❌');
  });

  it('displays the status icon ✔️', () => {
    render(
      <UploadStatus statusIcon={statusIconKey.TICK}>
        Some child content
      </UploadStatus>,
    );
    screen.getByText('Some child content ✔️');
  });

  it('displays the Loader status icon ✔️', () => {
    render(
      <UploadStatus statusIcon={statusIconKey.LOADER}>
        Some child content
      </UploadStatus>,
    );
    screen.getByRole('status');
  });
});

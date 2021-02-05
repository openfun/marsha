import { render } from '@testing-library/react';
import React from 'react';

import { statusIconKey, UploadStatus } from './UploadStatus';

describe('<UploadStatus />', () => {
  it('renders with children', () => {
    const { getByText } = render(
      <UploadStatus>Some child content</UploadStatus>,
    );
    getByText('Some child content');
  });

  it('displays the status icon ❌', () => {
    const { getByText } = render(
      <UploadStatus statusIcon={statusIconKey.X}>
        Some child content
      </UploadStatus>,
    );

    getByText('Some child content ❌');
  });

  it('displays the status icon ✔️', () => {
    const { getByText } = render(
      <UploadStatus statusIcon={statusIconKey.TICK}>
        Some child content
      </UploadStatus>,
    );

    getByText('Some child content ✔️');
  });

  it('displays the Loader status icon ✔️', () => {
    const { container } = render(
      <UploadStatus statusIcon={statusIconKey.LOADER}>
        Some child content
      </UploadStatus>,
    );

    expect(container.querySelector('div[aria-busy="true"]')).not.toBeNull();
  });
});

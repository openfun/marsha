import { fireEvent, render, wait } from '@testing-library/react';
import React from 'react';

import { UploadField } from '.';

describe('<UploadField />', () => {
  it('renders a Dropzone with the relevant messages', () => {
    const { getByText } = render(<UploadField onContentUpdated={jest.fn()} />);
    getByText('Select a file to upload');
  });

  it('passes the file to the callback', async () => {
    const callback = jest.fn();
    const { container, getByText } = render(
      <UploadField onContentUpdated={callback} />,
    );

    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });

    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: {
        files: [file],
      },
    });
    await wait();

    expect(callback).toHaveBeenCalledWith(file);
  });
});

import { render } from '@testing-library/react';
import React from 'react';

import DocumentPlayer from '.';
import { uploadState } from '../../types/tracks';

jest.mock('../../data/appData', () => ({
  appData: {
    document: {
      description: '',
      extension: 'pdf',
      filename: 'bar_foo.pdf',
      id: '42',
      is_ready_to_show: true,
      show_download: true,
      title: 'foo.pdf',
      upload_state: 'ready',
      url: 'https://example.com/document/42',
    },
  },
}));

describe('<DocumentPlayer />', () => {
  it('renders', () => {
    const document = {
      description: '',
      extension: 'pdf',
      filename: 'bar_foo.pdf',
      id: '42',
      is_ready_to_show: true,
      show_download: true,
      title: 'foo.pdf',
      upload_state: uploadState.READY,
      url: 'https://example.com/document/42',
    };
    const { getByText, container } = render(
      <DocumentPlayer document={document} />,
    );

    getByText('foo.pdf');
    expect(container.getElementsByClassName('icon-file-text2')).toHaveLength(1);
  });

  it('defaults to the document from props', () => {
    const document = {
      description: '',
      extension: 'pdf',
      filename: 'bar_foo.pdf',
      id: '43',
      is_ready_to_show: true,
      show_download: true,
      title: 'bar.pdf',
      upload_state: uploadState.READY,
      url: 'https://example.com/document/43',
    };
    const { getByText, container } = render(
      <DocumentPlayer document={document} />,
    );

    getByText('bar.pdf');
    expect(container.getElementsByClassName('icon-file-text2')).toHaveLength(1);
  });
});

import { render } from '@testing-library/react';
import React from 'react';

import DocumentPlayer from '.';
import { UploadState } from '../../types/tracks';
import { documentMockFactory } from '../../utils/tests/factories';

const mockDocument = documentMockFactory({
  id: '42',
  title: 'foo.pdf',
  upload_state: UploadState.READY,
});
jest.mock('../../data/appData', () => ({
  appData: {
    document: mockDocument,
  },
}));

describe('<DocumentPlayer />', () => {
  it('renders', () => {
    const document = documentMockFactory({
      id: '42',
      title: 'foo.pdf',
    });
    const { getByText, container } = render(
      <DocumentPlayer document={document} />,
    );

    getByText('foo.pdf');
    expect(container.getElementsByClassName('icon-file-text2')).toHaveLength(1);
  });

  it('defaults to the document from props', () => {
    const document = documentMockFactory({
      id: '43',
      title: 'bar.pdf',
    });
    const { getByText, container } = render(
      <DocumentPlayer document={document} />,
    );

    getByText('bar.pdf');
    expect(container.getElementsByClassName('icon-file-text2')).toHaveLength(1);
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import DocumentPlayer from '.';
import { XAPI_ENDPOINT } from '../../settings';
import { uploadState } from '../../types/tracks';
import { documentMockFactory } from '../../utils/tests/factories';

const mockDocument = documentMockFactory({
  id: '42',
  title: 'foo.pdf',
  upload_state: uploadState.READY,
});
jest.mock('../../data/appData', () => ({
  appData: {
    document: mockDocument,
    jwt: 'foo',
  },
  getDecodedJwt: jest.fn().mockImplementation(() => ({
    session_id: 'abcd',
  })),
}));

describe('<DocumentPlayer />', () => {
  it('renders', () => {
    const document = documentMockFactory({
      id: '42',
      title: 'foo.pdf',
    });
    const { container } = render(<DocumentPlayer document={document} />);

    screen.getByRole('link', { name: 'foo.pdf' });
    expect(container.getElementsByClassName('icon-file-text2')).toHaveLength(1);
  });

  it('defaults to the document from props', () => {
    const document = documentMockFactory({
      id: '43',
      title: 'bar.pdf',
    });
    const { container } = render(<DocumentPlayer document={document} />);

    screen.getByRole('link', { name: 'bar.pdf' });
    expect(container.getElementsByClassName('icon-file-text2')).toHaveLength(1);
  });

  it('sends the xapi downloaded statement when clicking on the link', async () => {
    fetchMock.mock(`${XAPI_ENDPOINT}/document/`, 204);
    const document = documentMockFactory({
      id: '42',
      title: 'foo.pdf',
    });
    const { container } = render(<DocumentPlayer document={document} />);

    const toDownload = screen.getByRole('link', { name: 'foo.pdf' });

    fireEvent.click(toDownload);
    fireEvent.blur(window);

    await waitFor(() =>
      expect(fetchMock.called(`${XAPI_ENDPOINT}/document/`)).toBe(true),
    );
  });
});

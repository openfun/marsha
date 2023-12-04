import { fireEvent, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  XAPI_ENDPOINT,
  uploadState,
  useCurrentSession,
  useJwt,
} from 'lib-components';
import { documentMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import DocumentPlayer from '.';

const mockDocument = documentMockFactory({
  id: '42',
  title: 'foo.pdf',
  upload_state: uploadState.READY,
});
jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    document: mockDocument,
  }),
}));

describe('<DocumentPlayer />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'foo',
    });

    useCurrentSession.setState({
      sessionId: 'abcd',
    });
  });

  it('renders', () => {
    const document = documentMockFactory({
      id: '42',
      title: 'foo.pdf',
    });
    render(<DocumentPlayer document={document} />);

    screen.getByRole('link', { name: 'foo.pdf' });
    expect(screen.getByRole('img')).toHaveClass('icon-file-text2');
  });

  it('defaults to the document from props', () => {
    const document = documentMockFactory({
      id: '43',
      title: 'bar.pdf',
    });
    render(<DocumentPlayer document={document} />);

    screen.getByRole('link', { name: 'bar.pdf' });
    expect(screen.getByRole('img')).toHaveClass('icon-file-text2');
  });

  it('sends the xapi downloaded statement when clicking on the link', async () => {
    const document = documentMockFactory({
      id: '42',
      title: 'foo.pdf',
    });
    fetchMock.mock(`${XAPI_ENDPOINT}/document/${document.id}/`, 204);

    render(<DocumentPlayer document={document} />);

    const toDownload = screen.getByRole('link', { name: 'foo.pdf' });

    fireEvent.click(toDownload);
    fireEvent.blur(window);

    await waitFor(() =>
      expect(
        fetchMock.called(`${XAPI_ENDPOINT}/document/${document.id}/`),
      ).toBe(true),
    );
  });
});

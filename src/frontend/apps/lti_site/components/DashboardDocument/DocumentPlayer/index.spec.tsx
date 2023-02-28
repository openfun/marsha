import { fireEvent, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  useCurrentSession,
  useJwt,
  XAPI_ENDPOINT,
  uploadState,
  documentMockFactory,
} from 'lib-components';
import React from 'react';

import render from 'utils/tests/render';

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
    const { elementContainer: container } = render(
      <DocumentPlayer document={document} />,
    );

    screen.getByRole('link', { name: 'foo.pdf' });
    expect(container!.getElementsByClassName('icon-file-text2')).toHaveLength(
      1,
    );
  });

  it('defaults to the document from props', () => {
    const document = documentMockFactory({
      id: '43',
      title: 'bar.pdf',
    });
    const { elementContainer: container } = render(
      <DocumentPlayer document={document} />,
    );

    screen.getByRole('link', { name: 'bar.pdf' });
    expect(container!.getElementsByClassName('icon-file-text2')).toHaveLength(
      1,
    );
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

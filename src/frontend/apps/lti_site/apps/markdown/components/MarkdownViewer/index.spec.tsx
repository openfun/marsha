import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import {
  markdownDocumentMockFactory,
  markdownTranslationMockFactory,
  markdownImageMockFactory,
} from 'apps/markdown/utils/tests/factories';
import { useJwt } from 'data/stores/useJwt';
import render from 'utils/tests/render';

import MarkdownViewer from '.';

jest.mock('apps/markdown/data/MarkdownAppData', () => ({
  MarkdownAppData: {
    modelName: 'markdown_documents',
    markdownDocument: null,
  },
}));
const MarkdownAppDataMock = jest.requireMock(
  'apps/markdown/data/MarkdownAppData',
);

describe('<MarkdownViewer />', () => {
  beforeEach(() => {
    useJwt.setState({
      getDecodedJwt: () => ({ locale: 'en_US' } as any),
    });
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows viewer', async () => {
    const markdownDocument = markdownDocumentMockFactory({
      id: '1',
      translations: [
        markdownTranslationMockFactory({
          language_code: 'en',
          title: 'Some english title',
          rendered_content: '<p>English document content.</p>',
        }),
        markdownTranslationMockFactory({
          language_code: 'fr',
          title: 'Un titre en français',
          rendered_content: '<p>Du contenu écrit en français.</p>',
        }),
      ],
    });
    MarkdownAppDataMock.MarkdownAppData.markdownDocument = markdownDocument;

    render(<MarkdownViewer />);

    expect(screen.queryByText('Some english title')).not.toBeInTheDocument();
    await screen.findByText('English document content.');

    // Change language to fr
    userEvent.click(screen.getByRole('button', { name: 'English' }));
    act(() => {
      userEvent.click(screen.getByText('French'));
    });

    expect(screen.queryByText('Un titre en français')).not.toBeInTheDocument();
    await screen.findByText('Du contenu écrit en français.');
  });

  it('shows translation missing', async () => {
    const markdownDocument = markdownDocumentMockFactory({
      id: '1',
      translations: [
        markdownTranslationMockFactory(
          markdownTranslationMockFactory({
            language_code: 'fr',
            title: 'Un titre en français',
            rendered_content: '<p>Contenu en français.</p>',
          }),
        ),
      ],
    });
    MarkdownAppDataMock.MarkdownAppData.markdownDocument = markdownDocument;

    render(<MarkdownViewer />);

    await screen.findByText('Translation not found');

    // Change language to fr
    userEvent.click(screen.getByRole('button', { name: 'English' }));
    act(() => {
      userEvent.click(screen.getByText('French'));
    });

    await screen.findByText('Contenu en français.');
    expect(screen.queryByText('Un titre en français')).not.toBeInTheDocument();
  });

  it('updates image URLs on the fly', async () => {
    const markdownDocument = markdownDocumentMockFactory({
      id: 'a7112894-2d05-11ed-be82-bfe0bf7618e0',
      images: [
        markdownImageMockFactory({
          id: '1e803506-2d05-11ed-9a38-d3375d2488e1',
          url: 'http://some-fr-image.png',
        }),
        markdownImageMockFactory({
          id: '1f2b4b8a-2d05-11ed-82ec-e7a6f1df3ec0',
          url: 'http://some-en-image.png',
        }),
      ],
      translations: [
        markdownTranslationMockFactory({
          language_code: 'en',
          title: 'Some english title',
          rendered_content:
            '<p>English document content.</p>' +
            '<img alt="my_english_scheme.png" src="https://dxnet918t1kj1.cloudfront.net/a7112894-2d05-11ed-be82-bfe0bf7618e0/markdown-image/1f2b4b8a-2d05-11ed-82ec-e7a6f1df3ec0/1662363864.png?Policy=ey...fX19XX0_&amp;Signature=X-dZa...jkZQ__&amp;Key-Pair-Id=W54PKKEYPAIR58">' +
            '<p>"Untouched" content.</p>',
        }),
        markdownTranslationMockFactory({
          language_code: 'fr',
          title: 'Un titre en français',
          rendered_content:
            '<p>Du contenu écrit en français.</p>' +
            '<img alt="mon_schema_francais.png" src="http://unsafe.cloudfront.net/a7112894-2d05-11ed-be82-bfe0bf7618e0/markdown-image/1e803506-2d05-11ed-9a38-d3375d2488e1/1662363873.png?Policy=ey...fX19XX0_&amp;Signature=X-dZa...jkZQ__&amp;Key-Pair-Id=W54PKKEYPAIR58">' +
            '<p>Du contenu "inchangé".</p>',
        }),
      ],
    });
    MarkdownAppDataMock.MarkdownAppData.markdownDocument = markdownDocument;

    render(<MarkdownViewer />);

    const markdownImageEn = await screen.findByRole('img');
    expect(markdownImageEn).toHaveAttribute('src', 'http://some-en-image.png');
    expect(markdownImageEn).toHaveAttribute('alt', 'my_english_scheme.png');
    screen.getByText('"Untouched" content.');

    // Change language to fr
    userEvent.click(screen.getByRole('button', { name: 'English' }));
    act(() => {
      userEvent.click(screen.getByText('French'));
    });

    const markdownImageFr = await screen.findByRole('img');
    expect(markdownImageFr).toHaveAttribute('src', 'http://some-fr-image.png');
    expect(markdownImageFr).toHaveAttribute('alt', 'mon_schema_francais.png');
    screen.getByText('Du contenu "inchangé".');
  });
});

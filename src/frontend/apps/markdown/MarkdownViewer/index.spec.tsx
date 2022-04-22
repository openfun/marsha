import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import {
  markdownDocumentMockFactory,
  markdownTranslationMockFactory,
} from 'apps/markdown/utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import MarkdownViewer from '.';

jest.mock('data/appData', () => ({
  getDecodedJwt: () => ({
    locale: 'en_US',
  }),
}));

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
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows viewer', async () => {
    window.scrollTo = jest.fn(); // required to test drop button, see grommet
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

    render(wrapInIntlProvider(<MarkdownViewer />));

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
    window.scrollTo = jest.fn(); // required to test drop button, see grommet
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

    render(wrapInIntlProvider(<MarkdownViewer />));

    await screen.findByText('Translation not found');

    // Change language to fr
    userEvent.click(screen.getByRole('button', { name: 'English' }));
    act(() => {
      userEvent.click(screen.getByText('French'));
    });

    await screen.findByText('Contenu en français.');
    expect(screen.queryByText('Un titre en français')).not.toBeInTheDocument();
  });
});

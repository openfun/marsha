import {
  markdownDocumentMockFactory,
  markdownTranslationMockFactory,
} from '@lib-markdown/tests/factories';

import { getMarkdownDocumentTranslatedContent } from './translations';

describe('getMarkdownDocumentTranslatedContent', () => {
  it('returns the existing translation', () => {
    const enTranslations = markdownTranslationMockFactory({
      language_code: 'en',
    });
    const frTranslations = markdownTranslationMockFactory({
      language_code: 'fr',
    });

    const markdownDocument = markdownDocumentMockFactory({
      translations: [enTranslations, frTranslations],
    });

    expect(
      getMarkdownDocumentTranslatedContent(markdownDocument, 'content', 'fr'),
    ).toEqual(frTranslations.content);
    expect(
      getMarkdownDocumentTranslatedContent(markdownDocument, 'title', 'fr'),
    ).toEqual(frTranslations.title);
    expect(
      getMarkdownDocumentTranslatedContent(
        markdownDocument,
        'rendered_content',
        'fr',
      ),
    ).toEqual(frTranslations.rendered_content);

    expect(
      getMarkdownDocumentTranslatedContent(markdownDocument, 'content', 'en'),
    ).toEqual(enTranslations.content);
    expect(
      getMarkdownDocumentTranslatedContent(markdownDocument, 'title', 'en'),
    ).toEqual(enTranslations.title);
    expect(
      getMarkdownDocumentTranslatedContent(
        markdownDocument,
        'rendered_content',
        'en',
      ),
    ).toEqual(enTranslations.rendered_content);
  });

  it('returns the default value for missing translations', () => {
    const markdownDocument = markdownDocumentMockFactory({});

    expect(
      getMarkdownDocumentTranslatedContent(
        markdownDocument,
        'content',
        'fr',
        'some default',
      ),
    ).toEqual('some default');
    expect(
      getMarkdownDocumentTranslatedContent(markdownDocument, 'title', 'fr'),
    ).toEqual('');
  });
});

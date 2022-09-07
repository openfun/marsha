import * as faker from 'faker';

import {
  MarkdownDocument,
  MarkdownDocumentTranslation,
} from 'apps/markdown/types/models';
import { playlistMockFactory } from 'utils/tests/factories';

export const markdownDocumentMockFactory = (
  markdownDocument: Partial<MarkdownDocument> = {},
): MarkdownDocument => {
  return {
    id: faker.datatype.uuid(),
    playlist: playlistMockFactory(),
    lti_url: faker.internet.url(),
    is_draft: false,
    rendering_options: {},
    translations: [markdownTranslationMockFactory()],
    ...markdownDocument,
  };
};

export const markdownTranslationMockFactory = (
  documentTranslation: Partial<MarkdownDocumentTranslation> = {},
): MarkdownDocumentTranslation => {
  return {
    language_code: 'en',
    title: faker.lorem.word(),
    content: faker.lorem.sentence(),
    rendered_content: `<p>${faker.lorem.sentence()}</p>`,
    ...documentTranslation,
  };
};

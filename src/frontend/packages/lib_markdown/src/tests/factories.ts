import { faker } from '@faker-js/faker';
import {
  MarkdownDocument,
  MarkdownDocumentTranslation,
  MarkdownImage,
  uploadState,
} from 'lib-components';
import { playlistMockFactory } from 'lib-components/tests';

export const markdownDocumentMockFactory = (
  markdownDocument: Partial<MarkdownDocument> = {},
): MarkdownDocument => {
  return {
    id: faker.string.uuid(),
    playlist: playlistMockFactory(),
    lti_url: faker.internet.url(),
    is_draft: false,
    rendering_options: {},
    translations: [markdownTranslationMockFactory()],
    images: [],
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

export const markdownImageMockFactory = (
  markdownImage: Partial<MarkdownImage> = {},
): MarkdownImage => {
  return {
    id: faker.string.uuid(),
    markdown_document: faker.string.uuid(),
    filename: faker.system.commonFileName('png'),
    is_ready_to_show: faker.datatype.boolean(),
    upload_state: faker.helpers.arrayElement(Object.values(uploadState)),
    active_stamp: faker.date.past().getTime().valueOf(),
    url: faker.internet.url(),
    ...markdownImage,
  };
};

import { MarkdownDocument, MarkdownDocumentTranslation } from '../types/models';

export const getMarkdownDocumentTranslatedContent = (
  markdownDocument: MarkdownDocument,
  content: keyof MarkdownDocumentTranslation,
  language: string,
  defaultValue?: string,
) => {
  const translation = markdownDocument!.translations.find(
    (value) => value.language_code === language,
  );
  return translation ? translation[content] : defaultValue || '';
};

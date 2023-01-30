import {
  AppData,
  MarkdownDocument,
  MarkdownDocumentModelName as modelName,
} from 'lib-components';

export interface MarkdownAppData extends Omit<AppData, 'modelName'> {
  modelName: modelName.MARKDOWN_DOCUMENTS;
  markdownDocument: MarkdownDocument;
  markdowns?: MarkdownDocument[];
  new_markdown_url?: string;
}

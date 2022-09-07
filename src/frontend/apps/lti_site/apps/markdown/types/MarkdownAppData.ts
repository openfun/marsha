import { AppData } from 'types/AppData';

import { MarkdownDocument, modelName } from './models';

export interface MarkdownAppData extends Omit<AppData, 'modelName'> {
  modelName: modelName.MARKDOWN_DOCUMENTS;
  markdownDocument: MarkdownDocument;
}

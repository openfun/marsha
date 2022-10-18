import { MarkdownAppData } from 'apps/markdown/types/MarkdownAppData';
import { MarkdownDocumentModelName as modelName } from 'lib-components';

export const parseDataElements = (element: Element): MarkdownAppData => {
  const context = JSON.parse(element.getAttribute('data-context')!);

  if (context.modelName === modelName.MARKDOWN_DOCUMENTS) {
    context.markdownDocument = context.resource;
    delete context.resource;
  }
  return context;
};

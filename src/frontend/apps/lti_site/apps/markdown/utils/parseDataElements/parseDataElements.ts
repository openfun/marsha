import { Nullable } from 'lib-common';
import { MarkdownDocumentModelName as modelName } from 'lib-components';
import { MarkdownAppData } from 'lib-markdown';

export const parseDataElements = (
  element: Nullable<Element>,
): MarkdownAppData => {
  if (!element) {
    throw new Error('Markdown appdata is missing from DOM.');
  }

  const dataContext = element.getAttribute('data-context');

  if (!dataContext) {
    throw new Error('Markdown data-context is missing from DOM.');
  }

  const context = JSON.parse(dataContext) as MarkdownAppData;

  context.resource_id = context.resource?.id;
  if (context.modelName === modelName.MARKDOWN_DOCUMENTS) {
    context.markdownDocument =
      context.resource as MarkdownAppData['markdownDocument'];
    delete context.resource;
  }
  return context;
};

import { Nullable } from 'lib-common';
import { AppConfig, AppData, modelName } from 'lib-components';

export const parseDataElements = (element: Nullable<Element>): AppData => {
  if (!element) {
    throw new Error('Appdata are missing from DOM.');
  }

  const dataContext = element.getAttribute('data-context');

  if (!dataContext) {
    throw new Error('data-context is missing from DOM.');
  }

  const context = JSON.parse(dataContext) as AppData;
  context.resource_id = context.resource?.id;
  if (context.modelName === modelName.VIDEOS) {
    context.video = context.resource as AppConfig['video'];
    delete context.resource;
  } else if (context.modelName === modelName.DOCUMENTS) {
    context.document = context.resource as AppConfig['document'];
    delete context.resource;
  }

  return context;
};

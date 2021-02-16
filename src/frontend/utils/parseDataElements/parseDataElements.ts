import { AppData } from '../../types/AppData';
import { ModelName } from '../../types/models';

export const parseDataElements = (element: Element): AppData => {
  const context = JSON.parse(element.getAttribute('data-context')!);

  if (context.modelName) {
    switch (context.modelName) {
      case ModelName.VIDEOS:
        context.video = context.resource;
        break;
      case ModelName.DOCUMENTS:
        context.document = context.resource;
        break;
      default:
        throw new Error(`Model ${context.modelName} not supported`);
    }

    delete context.resource;
  }

  return context;
};

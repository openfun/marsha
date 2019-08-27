import { AppData } from '../../types/AppData';
import { modelName } from '../../types/models';

export const parseDataElements = (element: Element): AppData => {
  const context = JSON.parse(element.getAttribute('data-context')!);

  if (context.modelName) {
    switch (context.modelName) {
      case modelName.VIDEOS:
        context.video = context.resource;
        break;
      case modelName.DOCUMENTS:
        context.document = context.resource;
        break;
      default:
        throw new Error(`Model ${context.modelName} not supported`);
    }

    delete context.resource;
  }

  return context;
};

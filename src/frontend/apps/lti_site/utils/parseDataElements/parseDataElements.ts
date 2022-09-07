import { AppData } from '../../types/AppData';
import { modelName } from '../../types/models';

export const parseDataElements = (element: Element): AppData => {
  const context = JSON.parse(element.getAttribute('data-context')!);

  if (context.modelName) {
    switch (context.modelName) {
      case modelName.VIDEOS:
        context.video = context.resource;
        delete context.resource;
        break;
      case modelName.DOCUMENTS:
        context.document = context.resource;
        delete context.resource;
        break;
    }
  }
  return context;
};

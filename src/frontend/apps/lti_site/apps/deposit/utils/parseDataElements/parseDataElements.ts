import { DepositAppData } from 'apps/deposit/types/DepositAppData';
import { modelName } from 'apps/deposit/types/models';

export const parseDataElements = (element: Element): DepositAppData => {
  const context = JSON.parse(element.getAttribute('data-context')!);

  if (context.modelName === modelName.FileDepositories) {
    context.fileDepository = context.resource;
    delete context.resource;
  }
  return context;
};

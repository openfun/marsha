import { Nullable } from 'lib-common';
import { FileDepositoryModelName as modelName } from 'lib-components';

import { DepositAppData } from 'apps/deposit/types/DepositAppData';

export const parseDataElements = (
  element: Nullable<Element>,
): DepositAppData => {
  if (!element) {
    throw new Error('Deposit AppData is missing from DOM.');
  }

  const dataContext = element.getAttribute('data-context');

  if (!dataContext) {
    throw new Error('Deposit data-context is missing from DOM.');
  }

  const context = JSON.parse(dataContext) as DepositAppData;
  context.resource_id = context.resource?.id;
  if (context.modelName === modelName.FileDepositories) {
    context.fileDepository =
      context.resource as DepositAppData['fileDepository'];
    delete context.resource;
  }
  return context;
};

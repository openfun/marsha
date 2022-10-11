import { Nullable } from 'lib-common';

import { AppData } from 'types/AppData';
import { FileDepository, modelName } from './models';

export interface DepositAppData extends Omit<AppData, 'modelName'> {
  modelName: modelName.FileDepositories;
  fileDepository?: Nullable<FileDepository>;
  deposits?: FileDepository[];
  new_deposit_url?: string;
}

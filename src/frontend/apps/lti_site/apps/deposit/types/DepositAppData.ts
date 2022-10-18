import { Nullable } from 'lib-common';

import { AppData } from 'types/AppData';
import {
  FileDepository,
  FileDepositoryModelName as modelName,
} from 'lib-components';

export interface DepositAppData extends Omit<AppData, 'modelName'> {
  modelName: modelName.FileDepositories;
  fileDepository?: Nullable<FileDepository>;
  deposits?: FileDepository[];
  new_deposit_url?: string;
}

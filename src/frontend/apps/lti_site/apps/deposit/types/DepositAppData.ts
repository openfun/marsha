import { Nullable } from 'utils/types';
import { AppData } from 'types/AppData';
import { FileDepository, modelName } from './models';

export interface DepositAppData extends Omit<AppData, 'modelName'> {
  modelName: modelName.FileDepositories;
  fileDepository?: Nullable<FileDepository>;
}

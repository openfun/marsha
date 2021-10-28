import { Nullable } from 'utils/types';
import { AppData } from 'types/AppData';
import { Meeting, modelName } from './models';

export interface BbbAppData extends Omit<AppData, 'modelName'> {
  modelName: modelName.MEETINGS;
  meeting?: Nullable<Meeting>;
}

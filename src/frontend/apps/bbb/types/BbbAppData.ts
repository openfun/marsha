import { Nullable } from 'utils/types';
import { AppData } from 'types/AppData';
import { Classroom, modelName } from './models';

export interface BbbAppData extends Omit<AppData, 'modelName'> {
  modelName: modelName.CLASSROOMS;
  classroom?: Nullable<Classroom>;
}

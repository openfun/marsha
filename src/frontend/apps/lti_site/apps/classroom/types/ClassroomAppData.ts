import { Nullable } from 'lib-common';

import { AppData } from 'types/AppData';
import { Classroom, modelName } from './models';

export interface ClassroomAppData extends Omit<AppData, 'modelName'> {
  modelName: modelName.CLASSROOMS;
  classroom?: Nullable<Classroom>;
}

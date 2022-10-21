import { Nullable } from 'lib-common';

import { AppData } from 'lib-components';
import { Classroom, ClassroomModelName as modelName } from 'lib-components';

export interface ClassroomAppData extends Omit<AppData, 'modelName'> {
  modelName: modelName.CLASSROOMS;
  classroom?: Nullable<Classroom>;
  classrooms?: Classroom[];
  new_classroom_url?: string;
}

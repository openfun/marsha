import { Nullable } from 'lib-common';
import { AppData, ClassroomModelName, Classroom } from 'lib-components';

export interface ClassroomAppData extends Omit<AppData, 'modelName'> {
  modelName: ClassroomModelName.CLASSROOMS;
  classroom?: Nullable<Classroom>;
  classrooms?: Classroom[];
  new_classroom_url?: string;
}

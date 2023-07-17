import { Nullable } from 'lib-common';
import {
  AppData,
  Classroom,
  ClassroomDocument,
  ClassroomModelName,
  ResourceMetadata,
} from 'lib-components';

export interface ClassroomAppData extends Omit<AppData, 'modelName'> {
  modelName: ClassroomModelName.CLASSROOMS;
  classroom?: Nullable<Classroom>;
  classrooms?: Classroom[];
  new_classroom_url?: string;
}

export interface ClassroomDocumentMetadata
  extends ResourceMetadata<ClassroomDocument> {
  upload_max_size_bytes: number;
}

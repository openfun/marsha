import { Nullable } from 'lib-common';
import {
  AppData,
  ClassroomModelName,
  Classroom,
  ClassroomDocument,
} from 'lib-components';
import { ResourceMetadata } from 'lib-video';

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

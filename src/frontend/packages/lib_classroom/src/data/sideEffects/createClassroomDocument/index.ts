import {
  API_ENDPOINT,
  Classroom,
  ClassroomDocument,
  ClassroomModelName,
  fetchWrapper,
  useJwt,
} from 'lib-components';

export const createClassroomDocument = async (file: {
  filename: string;
  size: number;
  classroom_id: Classroom['id'];
}) => {
  const jwt = useJwt.getState().getJwt();
  if (!jwt) {
    throw new Error('No JWT found');
  }
  const classroomModelName = ClassroomModelName.CLASSROOMS;
  const classroomDocumentsModelName = ClassroomModelName.CLASSROOM_DOCUMENTS;

  const response = await fetchWrapper(
    `${API_ENDPOINT}/${classroomModelName}/${file.classroom_id}/${classroomDocumentsModelName}/`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(file),
    },
  );

  if (!response.ok) {
    throw await response.json();
  }

  const classroomDocument = (await response.json()) as ClassroomDocument;

  return classroomDocument;
};

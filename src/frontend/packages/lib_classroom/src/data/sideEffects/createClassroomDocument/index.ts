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
  classroom: Classroom['id'];
}) => {
  const jwt = useJwt.getState().getJwt();
  if (!jwt) {
    throw new Error('No JWT found');
  }

  const response = await fetchWrapper(
    `${API_ENDPOINT}/${String(ClassroomModelName.CLASSROOM_DOCUMENTS)}/`,
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

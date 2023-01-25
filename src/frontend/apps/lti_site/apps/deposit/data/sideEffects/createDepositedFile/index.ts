import {
  useJwt,
  API_ENDPOINT,
  DepositedFile,
  FileDepositoryModelName as modelName,
  fetchWrapper,
} from 'lib-components';

export const createDepositedFile = async (file: {
  size: number;
  filename: string;
}) => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/${modelName.DepositedFiles}/`,
    {
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(file),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to create a new deposited file.');
  }

  const depositedFile: DepositedFile = await response.json();

  return depositedFile;
};

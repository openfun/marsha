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
        Authorization: `Bearer ${useJwt.getState().getJwt()}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(file),
    },
  );

  if (!response.ok) {
    throw await response.json();
  }

  const depositedFile: DepositedFile = await response.json();

  return depositedFile;
};

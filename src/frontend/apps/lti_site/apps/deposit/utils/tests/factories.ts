import * as faker from 'faker';

import { uploadState } from 'types/tracks';
import { playlistMockFactory } from 'utils/tests/factories';

import { DepositedFile, FileDepository } from 'apps/deposit/types/models';

const { READY } = uploadState;

export const fileDepositoryMockFactory = (
  fileDepository: Partial<FileDepository> = {},
): FileDepository => {
  return {
    id: faker.datatype.uuid(),
    playlist: playlistMockFactory(),
    title: faker.name.title(),
    description: faker.lorem.paragraph(),
    deposited_files: [],
    lti_url: faker.internet.url(),
    ...fileDepository,
  };
};

export const depositedFileMockFactory = (
  depositedFile: Partial<DepositedFile> = {},
): DepositedFile => {
  return {
    file_depository: fileDepositoryMockFactory(),
    filename: faker.system.fileName(),
    size: faker.datatype.number().toString(),
    id: faker.datatype.uuid(),
    upload_state: faker.random.word(),
    uploaded_by: faker.name.firstName() + ' ' + faker.name.lastName(),
    uploaded_on: faker.date.recent().toISOString(),
    url: faker.internet.url(),
    ...depositedFile,
  };
};

import { faker } from '@faker-js/faker';
import {
  DepositedFile,
  FileDepository,
  playlistMockFactory,
  uploadState,
} from 'lib-components';

const { READY } = uploadState;

export const fileDepositoryMockFactory = (
  fileDepository: Partial<FileDepository> = {},
): FileDepository => {
  return {
    id: faker.string.uuid(),
    playlist: playlistMockFactory(),
    title: faker.lorem.words(),
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
    author_name: faker.name.firstName() + ' ' + faker.name.lastName(),
    file_depository_id: faker.datatype.uuid(),
    filename: faker.system.fileName(),
    size: faker.datatype.number().toString(),
    id: faker.datatype.uuid(),
    read: false,
    upload_state: READY,
    uploaded_on: faker.date.recent().toISOString(),
    url: faker.internet.url(),
    ...depositedFile,
  };
};

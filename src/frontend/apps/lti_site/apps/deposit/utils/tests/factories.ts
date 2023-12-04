import { faker } from '@faker-js/faker';
import { DepositedFile, FileDepository, uploadState } from 'lib-components';
import { playlistMockFactory } from 'lib-components/tests';

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
    author_name: faker.person.firstName() + ' ' + faker.person.lastName(),
    file_depository_id: faker.string.uuid(),
    filename: faker.system.fileName(),
    size: faker.number.int().toString(),
    id: faker.string.uuid(),
    read: false,
    upload_state: READY,
    uploaded_on: faker.date.recent().toISOString(),
    url: faker.internet.url(),
    ...depositedFile,
  };
};

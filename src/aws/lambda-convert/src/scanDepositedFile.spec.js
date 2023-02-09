process.env.S3_DESTINATION_BUCKET = 'destination_bucket';

const mockUpdateState = jest.fn();
jest.doMock('update-state', () => mockUpdateState);

// Mock the AWS SDK calls used in scanDepositedFile
const mockGetObject = jest.fn();
const mockCopyObject = jest.fn();
jest.mock('aws-sdk', () => ({
  S3: function () {
    this.copyObject = mockCopyObject;
    this.getObject = mockGetObject;
  },
}));

const fs = require('fs');
const scanDepositedFile = require('./scanDepositedFile');
const testDirectory = `${__dirname}/../testfiles`;
const cleanPdfFile = `${testDirectory}/sample.pdf`;
const infectedPdfFile = `${testDirectory}/pdf-doc-vba-eicar-dropper.pdf`;

const objectKeyWithoutExtension =
  '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/depositedfile/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1606230873';
const objectKey = `${objectKeyWithoutExtension}.pdf`;

jest.setTimeout(30000);

describe('lambda-convert/src/scanDepositedFile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Don't pollute tests with logs intended for CloudWatch
    jest.spyOn(console, 'log').mockImplementation();
  });

  it('copy a clean deposited file from a source to a destination bucket', async () => {
    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise((resolve) =>
          resolve({ Body: fs.readFileSync(cleanPdfFile) }),
        ),
    });
    mockCopyObject.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });

    await scanDepositedFile(objectKey, 'source_bucket');

    expect(mockUpdateState).toHaveBeenCalledWith(objectKey, 'scanning');

    expect(mockUpdateState).toHaveBeenCalledWith(objectKey, 'copying');

    expect(mockUpdateState).toHaveBeenCalledWith(objectKey, 'ready', {
      extension: 'pdf',
    });

    expect(mockCopyObject).toHaveBeenCalledWith({
      Bucket: 'destination_bucket',
      Key: objectKey,
      CopySource: `source_bucket/${objectKey}`,
    });
  });

  it('copy a clean deposited file without extension from a source to a destination bucket', async () => {
    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise((resolve) =>
          resolve({ Body: fs.readFileSync(cleanPdfFile) }),
        ),
    });
    mockCopyObject.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });

    await scanDepositedFile(objectKeyWithoutExtension, 'source_bucket');

    expect(mockUpdateState).toHaveBeenCalledWith(
      objectKeyWithoutExtension,
      'scanning',
    );

    expect(mockUpdateState).toHaveBeenCalledWith(
      objectKeyWithoutExtension,
      'copying',
    );

    expect(mockUpdateState).toHaveBeenCalledWith(
      objectKeyWithoutExtension,
      'ready',
    );

    expect(mockCopyObject).toHaveBeenCalledWith({
      Bucket: 'destination_bucket',
      Key: objectKeyWithoutExtension,
      CopySource: `source_bucket/${objectKeyWithoutExtension}`,
    });
  });

  it('copy an infected deposited file from a source to a destination bucket', async () => {
    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise((resolve) =>
          resolve({ Body: fs.readFileSync(infectedPdfFile) }),
        ),
    });
    mockCopyObject.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });

    await scanDepositedFile(objectKey, 'source_bucket');

    expect(mockUpdateState).toHaveBeenCalledWith(objectKey, 'scanning');

    expect(mockUpdateState).toHaveBeenCalledWith(objectKey, 'infected', {
      error: ['Doc.Dropper.Agent-1540415'],
    });

    expect(mockUpdateState).not.toHaveBeenCalledWith(objectKey, 'copying');

    expect(mockCopyObject).not.toHaveBeenCalledWith({
      Bucket: 'destination_bucket',
      Key: objectKey,
      CopySource: `source_bucket/${objectKey}`,
    });
  });
});

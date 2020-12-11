process.env.S3_DESTINATION_BUCKET = "destination_bucket";

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, "log");

// Mock the AWS SDK calls used in encodeTimedTextTrack
const mockCopyObject = jest.fn();
jest.mock("aws-sdk", () => ({
  S3: function () {
    this.copyObject = mockCopyObject;
  },
}));

const copyDocument = require("./copyDocument");

describe("lambda-encore/src/copyDocument", () => {
  beforeEach(() => {
    console.log.mockReset();
    jest.resetAllMocks();
  });

  it("copy a document from a source to a destination bucket", async () => {
    mockCopyObject.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });

    await copyDocument(
      "a3e213a7-9c56-4bd3-b71c-fe567b0cfe12/document/a3e213a7-9c56-4bd3-b71c-fe567b0cfe12/1606230873.zip",
      "source_bucket"
    );

    expect(mockCopyObject).toHaveBeenCalledWith({
      Bucket: "destination_bucket",
      Key: "a3e213a7-9c56-4bd3-b71c-fe567b0cfe12/document/1606230873.zip",
      CopySource: `source_bucket/a3e213a7-9c56-4bd3-b71c-fe567b0cfe12/document/a3e213a7-9c56-4bd3-b71c-fe567b0cfe12/1606230873.zip`,
    });
  });
});

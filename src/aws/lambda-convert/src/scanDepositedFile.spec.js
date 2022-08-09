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

const scanDepositedFile = require("./scanDepositedFile");

describe("lambda-convert/src/scanDepositedFile", () => {
  beforeEach(() => {
    console.log.mockReset();
    jest.resetAllMocks();
  });

  it("copy a deposited file from a source to a destination bucket", async () => {
    mockCopyObject.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });

    const { extension } = await scanDepositedFile(
      "630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/depositedfile/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1606230873.zip",
      "source_bucket"
    );

    expect(extension).toBe("zip");
    expect(mockCopyObject).toHaveBeenCalledWith({
      Bucket: "destination_bucket",
      Key: "630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/depositedfile/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1606230873.zip",
      CopySource: `source_bucket/630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/depositedfile/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1606230873.zip`,
    });
  });
});

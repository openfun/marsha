const fs = require("fs");

process.env.S3_DESTINATION_BUCKET = "destination_bucket";

const testDirectory = `${__dirname}/../testfiles/`;
const pdfFile = `${testDirectory}sample.pdf`;
const svgFiles = [
  `${testDirectory}sample-1.svg`,
  `${testDirectory}sample-2.svg`,
  `${testDirectory}sample-3.svg`,
];

// Don't pollute tests with logs intended for CloudWatch
jest.spyOn(console, "log");

// Mock the AWS SDK calls used in encodeTimedTextTrack
const mockGetObject = jest.fn();
const mockPutObject = jest.fn();
jest.mock("aws-sdk", () => ({
  S3: function () {
    this.getObject = mockGetObject;
    this.putObject = mockPutObject;
  },
}));

const convertSharedLiveMedia = require("./convertSharedLiveMedia");

describe("lambda-convert/src/convertSharedLiveMedia", () => {
  beforeEach(() => {
    console.log.mockReset();
    jest.resetAllMocks();
  });
  it("converts uploaded sharedlivemedia", async () => {
    mockGetObject.mockReturnValue({
      promise: () =>
        new Promise((resolve) => resolve({ Body: fs.readFileSync(pdfFile) })),
    });
    mockPutObject.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });

    const { nbPages, extension } = await convertSharedLiveMedia(
      "ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200.pdf",
      "source bucket"
    );

    expect(nbPages).toBe(3);
    expect(extension).toBe("pdf");
    expect(mockPutObject).toHaveBeenCalledTimes(nbPages);
    expect(mockPutObject).toHaveBeenCalledWith({
      Body: fs.readFileSync(svgFiles[0]),
      Key: "ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200_1.svg",
      Bucket: "destination_bucket",
    });
    expect(mockPutObject).toHaveBeenCalledWith({
      Body: fs.readFileSync(svgFiles[1]),
      Key: "ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200_2.svg",
      Bucket: "destination_bucket",
    });
    expect(mockPutObject).toHaveBeenCalledWith({
      Body: fs.readFileSync(svgFiles[2]),
      Key: "ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200_3.svg",
      Bucket: "destination_bucket",
    });
  });
});

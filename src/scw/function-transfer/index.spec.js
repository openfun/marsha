process.env.DISABLE_SSL_VALIDATION = "false";

// Mock our own sub-modules to simplify our tests
const mockTransferClassroomRecording = jest.fn();
jest.doMock(
  "./src/transferClassroomRecording",
  () => mockTransferClassroomRecording,
);

const mockTransferEnded = jest.fn();
jest.doMock("./src/transferEnded", () => mockTransferEnded);

const function_transfer = require("./index.js").handler;

const callback = jest.fn();

describe("function_transfer", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, "log").mockImplementation();
  });

  describe("called with classroomrecording parameters", () => {
    it("reports an error when recordUrl parameter is missing", async () => {
      await function_transfer(
        {
          body: JSON.stringify({
            vodKey: "tmp/video/c7cd077e-65f4-4d34-8df1-c9f1105ea660/1683275646",
          }),
        },
        null,
        callback,
      );

      expect(callback).toHaveBeenCalledWith(
        new Error(
          "transferClassroomRecording should contain recordUrl, vodKey and bucket parameters.",
        ),
      );
    });

    it("reports an error when vodKey parameter is missing", async () => {
      await function_transfer(
        {
          body: JSON.stringify({
            recordUrl: "https://example.com/recording.mp4",
          }),
        },
        null,
        callback,
      );

      expect(callback).toHaveBeenCalledWith(
        new Error(
          "transferClassroomRecording should contain recordUrl, vodKey and bucket parameters.",
        ),
      );
    });

    it("reports an error when parameters are missing", async () => {
      await function_transfer({}, null, callback);

      expect(callback).toHaveBeenCalledWith(
        new Error(
          "transferClassroomRecording should contain recordUrl, vodKey and bucket parameters.",
        ),
      );
    });

    it("delegates to transferClassroomRecording and call transferEnded", async () => {
      mockTransferClassroomRecording.mockImplementation(() =>
        Promise.resolve(),
      );
      await function_transfer(
        {
          body: JSON.stringify({
            recordUrl: "https://example.com/recording.mp4",
            vodKey:
              "c7cd077e-65f4-4d34-8df1-c9f1105ea660/video/c7cd077e-65f4-4d34-8df1-c9f1105ea660/1683275646",
            bucket: "source bucket",
          }),
        },
        null,
        callback,
      );

      expect(mockTransferClassroomRecording).toHaveBeenCalledWith(
        "https://example.com/recording.mp4",
        "c7cd077e-65f4-4d34-8df1-c9f1105ea660/video/c7cd077e-65f4-4d34-8df1-c9f1105ea660/1683275646",
        "source bucket",
      );
      expect(mockTransferEnded).toHaveBeenCalledWith(
        "c7cd077e-65f4-4d34-8df1-c9f1105ea660/video/c7cd077e-65f4-4d34-8df1-c9f1105ea660/1683275646",
      );
      expect(callback).toHaveBeenCalled();
    });
  });
});

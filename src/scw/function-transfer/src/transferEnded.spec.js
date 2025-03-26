process.env.MARSHA_BASE_URL = "https://example.com";
process.env.DISABLE_SSL_VALIDATION = "false";
process.env.SHARED_SECRET = "some secret";

// Use a stub to mock calls to the network
const requestStub = jest.fn();
jest.doMock("request-promise-native", () => requestStub);

const mockConsoleLog = jest.spyOn(console, "log");

describe("function-transfer/src/transferEnded", () => {
  beforeEach(() => {
    // Make sure to reset the modules so we get a chance to alter process.env between tests
    jest.resetModules();

    // Reset the mocks we'll be testing
    mockConsoleLog.mockReset();
    requestStub.mockReset();
  });

  it("calculates the signature and posts to the server", async () => {
    const transferEnded = require("./transferEnded.js");

    const videoId = "videoId123";
    const apiEndpoint = `${process.env.MARSHA_BASE_URL}/videos/${videoId}/transfer-ended/`;
    const vodKey = `tmp/${videoId}/video/1298340`;

    await transferEnded(vodKey);

    const anteLogArgument = mockConsoleLog.mock.calls[0][0];
    expect(anteLogArgument).toContain(
      `Video transfer ended: POST ${apiEndpoint}`,
    );
    expect(anteLogArgument).toContain(vodKey);

    expect(requestStub).toHaveBeenCalledWith({
      body: {
        file_key: vodKey,
      },
      headers: {
        "X-Marsha-Signature":
          "cdd4786f84907e9b964c262119525d927bf33c911c5e979a0c95ef0b18e900fa",
      },
      json: true,
      method: "POST",
      strictSSL: true,
      uri: apiEndpoint,
    });
  });

  it("disables SSL when DISABLE_SSL_VALIDATION is truthy", async () => {
    process.env.DISABLE_SSL_VALIDATION = "true";

    const transferEnded = require("./transferEnded.js");

    const videoId = "videoId123";
    const apiEndpoint = `${process.env.MARSHA_BASE_URL}/videos/${videoId}/transfer-ended/`;
    const vodKey = `tmp/${videoId}/video/1298340`;

    await transferEnded(vodKey);

    expect(requestStub).toHaveBeenCalledWith({
      body: {
        file_key: vodKey,
      },
      headers: {
        "X-Marsha-Signature":
          "cdd4786f84907e9b964c262119525d927bf33c911c5e979a0c95ef0b18e900fa",
      },
      json: true,
      method: "POST",
      strictSSL: false,
      uri: apiEndpoint,
    });

    process.env.DISABLE_SSL_VALIDATION = "false";
  });

  it("rejects when the request fails", async () => {
    process.env.DISABLE_SSL_VALIDATION = "true";

    const transferEnded = require("./transferEnded.js");

    const videoId = "videoId123";
    const apiEndpoint = `${process.env.MARSHA_BASE_URL}/videos/${videoId}/transfer-ended/`;
    const vodKey = `tmp/${videoId}/video/1298340`;

    requestStub.mockImplementation(
      () => new Promise((resolve, reject) => reject("Failed!")),
    );

    await expect(transferEnded(vodKey)).rejects.toEqual("Failed!");

    expect(requestStub).toHaveBeenCalledWith({
      body: {
        file_key: vodKey,
      },
      headers: {
        "X-Marsha-Signature":
          "cdd4786f84907e9b964c262119525d927bf33c911c5e979a0c95ef0b18e900fa",
      },
      json: true,
      method: "POST",
      strictSSL: false,
      uri: apiEndpoint,
    });

    const anteLogArgument = mockConsoleLog.mock.calls[0][0];
    expect(anteLogArgument).toContain(
      `Video transfer ended: POST ${apiEndpoint}`,
    );
    expect(anteLogArgument).toContain(vodKey);
  });
});

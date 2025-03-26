const fs = require("fs");
const Response = require("node-fetch").Response;
const ReadableStream = require("stream").Readable;
const testDirectory = `${__dirname}/../testfiles/`;
const videoFile = `${testDirectory}big_buck_bunny_1080p.mp4`;
const bbbHtmlVideoFile = `${testDirectory}bbb-video-template.html`;

// Mock the AWS SDK calls used in transferClassroomRecording
const mockUpload = jest.fn();
jest.mock("aws-sdk", () => ({
  S3: function () {
    this.upload = mockUpload;
  },
}));

jest.mock("node-fetch", () => require("fetch-mock-jest").sandbox());
const fetchMock = require("node-fetch");

const transferClassroomRecording = require("./transferClassroomRecording");

describe("function-transfer/src/transferClassroomRecording", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Don't pollute tests with logs intended for CloudWatch
    jest.spyOn(console, "log").mockImplementation();
    fetchMock.mockReset();
    mockUpload.mockReset();
  });

  it("copies uploaded classroom recording", async () => {
    mockUpload.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });

    const videoStream = new ReadableStream();
    videoStream.push(fs.readFileSync(videoFile));
    videoStream.push(null);
    fetchMock.mock(
      "https://example.com/recording.mp4",
      new Response(videoStream, {
        headers: {
          "Content-Type": "video/mp4",
        },
      }),
    );

    await transferClassroomRecording(
      "https://example.com/recording.mp4",
      "630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/video/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735_fr",
      "source bucket",
    );

    expect(mockUpload).toHaveBeenCalledTimes(1);
  });

  it("copies uploaded classroom after resolving a redirect", async () => {
    mockUpload.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });
    const protectedUrl = "https://example.com/recording/1234/video?token=456";
    const playbackUrl = "https://example.com/playback/video/1234";
    const htmlVideoUrl = "https://example.com/video/1234";

    fetchMock.mock(protectedUrl, {
      status: 302,
      redirectUrl: playbackUrl,
      headers: {
        "Content-Type": "text/html",
        location: playbackUrl,
      },
    });

    fetchMock.mock(playbackUrl, {
      status: 302,
      redirectUrl: htmlVideoUrl,
      headers: {
        "Content-Type": "text/html",
        location: htmlVideoUrl,
      },
    });

    fetchMock.mock(htmlVideoUrl, {
      body: fs.readFileSync(bbbHtmlVideoFile, "utf8"),
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });

    const videoStream = new ReadableStream();
    videoStream.push(fs.readFileSync(videoFile));
    videoStream.push(null);
    fetchMock.mock(`${htmlVideoUrl}/video-0.m4v`, new Response(videoStream));

    await transferClassroomRecording(
      protectedUrl,
      "630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/video/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735_fr",
      "source bucket",
    );

    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(fetchMock.called(htmlVideoUrl)).toBe(true);
    expect(fetchMock.called(playbackUrl)).toBe(true);
    expect(fetchMock.called(`${htmlVideoUrl}/video-0.m4v`)).toBe(true);
  });

  it("copies uploaded classroom after resolving a redirect with a cookie", async () => {
    mockUpload.mockReturnValue({
      promise: () => new Promise((resolve) => resolve()),
    });
    const protectedUrl = "https://example.com/recording/1234/video?token=456";
    const playbackUrl = "https://example.com/playback/video/1234";
    const htmlVideoUrl = "https://example.com/video/1234";

    fetchMock.mock(protectedUrl, {
      status: 302,
      redirectUrl: playbackUrl,
      headers: {
        "Content-Type": "text/html",
        location: playbackUrl,
        "Set-Cookie": "recording_video_1234=xxxxx",
      },
    });

    fetchMock.mock(playbackUrl, {
      status: 302,
      redirectUrl: htmlVideoUrl,
      headers: {
        "Content-Type": "text/html",
        location: htmlVideoUrl,
      },
    });

    fetchMock.mock(htmlVideoUrl, {
      body: fs.readFileSync(bbbHtmlVideoFile, "utf8"),
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });

    const videoStream = new ReadableStream();
    videoStream.push(fs.readFileSync(videoFile));
    videoStream.push(null);
    fetchMock.mock(`${htmlVideoUrl}/video-0.m4v`, new Response(videoStream));

    await transferClassroomRecording(
      protectedUrl,
      "630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/video/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735_fr",
      "source bucket",
    );

    expect(mockUpload).toHaveBeenCalledTimes(1);

    expect(fetchMock.called(htmlVideoUrl)).toBe(true);
    // fetch made after redicrect on the html file should have a Cookie header
    const htmlVideoUrlCall = fetchMock.lastCall(htmlVideoUrl);
    expect(htmlVideoUrlCall[1].headers.Cookie).toBe(
      "recording_video_1234=xxxxx",
    );

    expect(fetchMock.called(playbackUrl)).toBe(true);
    // fetch made after redicrect on the html file should have a Cookie header
    const playbackUrlCall = fetchMock.lastCall(playbackUrl);
    expect(playbackUrlCall[1].headers.Cookie).toBe(
      "recording_video_1234=xxxxx",
    );

    expect(fetchMock.called(`${htmlVideoUrl}/video-0.m4v`)).toBe(true);
    // fetch made on the video file should have a Cookie header
    const videoUrlCall = fetchMock.lastCall(`${htmlVideoUrl}/video-0.m4v`);
    expect(videoUrlCall[1].headers.Cookie).toBe("recording_video_1234=xxxxx");
  });
});

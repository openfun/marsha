process.env.DISABLE_SSL_VALIDATION = 'false';

// Mock our own sub-modules to simplify our tests
const mockEncodeTimedTextTrack = jest.fn();
jest.doMock('./src/encodeTimedTextTrack', () => mockEncodeTimedTextTrack);

const mockEncodeVideo = jest.fn();
jest.doMock('./src/encodeVideo', () => mockEncodeVideo);

const mockUpdateState = jest.fn();
jest.doMock('update-state', () => mockUpdateState);

const mockResizeThumbnails = jest.fn();
jest.doMock('./src/resizeThumbnails', () => mockResizeThumbnails);

const mockCopyDocument = jest.fn();
jest.doMock('./src/copyDocument', () => mockCopyDocument);

const mockConvertSharedLiveMedia = jest.fn();
jest.doMock('./src/convertSharedLiveMedia', () => mockConvertSharedLiveMedia);

const mockScanDepositedFile = jest.fn();
jest.doMock('./src/scanDepositedFile', () => mockScanDepositedFile);

const mockCopyClassroomDocument = jest.fn();
jest.doMock('./src/copyClassroomDocument', () => mockCopyClassroomDocument);

const lambda = require('./index.js').handler;

const callback = jest.fn();

describe('lambda', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Don't pollute tests with logs intended for CloudWatch
    jest.spyOn(console, 'log').mockImplementation();
  });

  it('reports a specific error when a video object key has an unexpected format', () => {
    lambda(
      {
        Records: [
          {
            s3: {
              bucket: { name: 'some bucket' },
              object: {
                key: '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/video/dba1512e-d0b3-40cc-ae44-722fbe8cba6a',
              },
            },
          },
        ],
      },
      null,
      callback,
    );
    expect(mockUpdateState).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(
      'Source videos should be uploaded in a folder of the form "{video_id}/video/{video_id}/{stamp}".',
    );
  });

  it('reports a specific error when a timed text object key has an unexpected format', () => {
    lambda(
      {
        Records: [
          {
            s3: {
              bucket: { name: 'some bucket' },
              object: {
                key: '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/timedtexttrack/dba1512e-d0b3-40cc-ae44-722fbe8cba6a',
              },
            },
          },
        ],
      },
      null,
      callback,
    );
    expect(mockUpdateState).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(
      'Source timed text files should be uploaded to a folder of the form ' +
        '"{playlist_id}/timedtexttrack/{timedtext_id}/{stamp}_{language}[_{has_closed_caption}]".',
    );
  });

  it('reports an error when the kind of object is unexpected', () => {
    lambda(
      {
        Records: [
          {
            s3: {
              bucket: { name: 'some bucket' },
              object: {
                key: '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/subtitletrack/dba1512e-d0b3-40cc-ae44-722fbe8cba6a',
              },
            },
          },
        ],
      },
      null,
      callback,
    );
    expect(mockUpdateState).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(
      'Unrecognized kind subtitletrack in key ' +
        '"630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/subtitletrack/dba1512e-d0b3-40cc-ae44-722fbe8cba6a".',
    );
  });

  it('reports an error when the object key has an unexpected format', () => {
    lambda(
      {
        Records: [
          {
            s3: {
              bucket: { name: 'some bucket' },
              object: { key: 'invalid key' },
            },
          },
        ],
      },
      null,
      callback,
    );
    expect(mockUpdateState).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(
      'Unrecognized key format "invalid key"',
    );
  });

  it('reports an error when a thumbnail has an unexpected format', () => {
    lambda(
      {
        Records: [
          {
            s3: {
              bucket: { name: 'source bucket' },
              object: {
                key: '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/thumbnail/dba1512e-d0b3-40cc-ae44-722fbe8cba6a',
              },
            },
          },
        ],
      },
      null,
      callback,
    );
    expect(callback).toHaveBeenCalledWith(
      'Source thumbnails should be uploaded in a folder of the form ' +
        '"{playlist_id}/thumbnail/{thumbnail_id}/{stamp}".',
    );
  });

  describe('called with a timed text object', () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'source bucket',
            },
            object: {
              key: '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/timedtexttrack/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735_fr_st',
            },
          },
        },
      ],
    };

    it('delegates to encodeTimedTextTrack', async () => {
      mockEncodeTimedTextTrack.mockImplementation(() => Promise.resolve());
      await lambda(event, null, callback);

      expect(mockEncodeTimedTextTrack).toHaveBeenCalledWith(
        '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/timedtexttrack/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735_fr_st',
        'source bucket',
        '1542967735_fr_st',
      );
    });

    it('delegates to encodeTimedTextTrack and reports the error when it fails', async () => {
      mockEncodeTimedTextTrack.mockImplementation(
        () => new Promise((resolve, reject) => reject('Failed!')),
      );

      await lambda(event, null, callback);

      expect(mockEncodeTimedTextTrack).toHaveBeenCalledWith(
        '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/timedtexttrack/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735_fr_st',
        'source bucket',
        '1542967735_fr_st',
      );
      expect(mockUpdateState).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith('Failed!');
    });
  });

  describe('called with a video object', () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'source bucket',
            },
            object: {
              key: '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/video/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735_fr',
            },
          },
        },
      ],
    };

    it('delegates to encodeVideo and calls updateState & callback when it succeeds', async () => {
      mockEncodeVideo.mockReturnValue(Promise.resolve({ Job: { Id: '42' } }));
      await lambda(event, null, callback);

      expect(mockEncodeVideo).toHaveBeenCalledWith(
        '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/video/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735_fr',
        'source bucket',
      );
      expect(mockUpdateState).toHaveBeenCalledWith(
        '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/video/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735_fr',
        'processing',
      );
    });

    it('delegates to encodeVideo and reports the error when it fails', async () => {
      mockEncodeVideo.mockImplementation(
        () => new Promise((resolve, reject) => reject('Failed!')),
      );

      await lambda(event, null, callback);

      expect(mockEncodeVideo).toHaveBeenCalledWith(
        '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/video/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735_fr',
        'source bucket',
      );
      expect(mockUpdateState).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith('Failed!');
    });
  });

  describe('called with a thumbnail object', () => {
    it('delegates to resizeThumbnails and call updateState', async () => {
      await lambda(
        {
          Records: [
            {
              s3: {
                bucket: { name: 'source bucket' },
                object: {
                  key: '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/thumbnail/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735',
                },
              },
            },
          ],
        },
        null,
        callback,
      );

      expect(mockResizeThumbnails).toHaveBeenCalledWith(
        '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/thumbnail/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735',
        'source bucket',
      );
      expect(mockUpdateState).toHaveBeenCalledWith(
        '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/thumbnail/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735',
        'ready',
      );
    });
  });

  describe('called with a document object', () => {
    it('reports an error when a document has an unexpected format', () => {
      lambda(
        {
          Records: [
            {
              s3: {
                bucket: { name: 'source bucket' },
                object: {
                  key: '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/document/dba1512e-d0b3-40cc-ae44-722fbe8cba6a',
                },
              },
            },
          ],
        },
        null,
        callback,
      );
      expect(callback).toHaveBeenCalledWith(
        'Source document should be uploaded to a folder of the form ' +
          '"{document_id}/document/{document_id}/{stamp}".',
      );
    });

    it('delegates to copyDocument and call updateState', async () => {
      await lambda(
        {
          Records: [
            {
              s3: {
                bucket: { name: 'source bucket' },
                object: {
                  key: '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/document/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735',
                },
              },
            },
          ],
        },
        null,
        callback,
      );

      expect(mockCopyDocument).toHaveBeenCalledWith(
        '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/document/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735',
        'source bucket',
      );
      expect(mockUpdateState).toHaveBeenCalledWith(
        '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/document/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735',
        'ready',
      );
    });
  });

  describe('called with a sharedlivemedia object', () => {
    it('reports an error when a sharedlivemedia has an unexpected format', () => {
      lambda(
        {
          Records: [
            {
              s3: {
                bucket: { name: 'source bucket' },
                object: {
                  key: 'ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/c5cad053-111a-4e0e-8f78-fe43dec11512',
                },
              },
            },
          ],
        },
        null,
        callback,
      );
      expect(callback).toHaveBeenCalledWith(
        'Source sharedlivemedia should be uploaded to a folder of the form ' +
          '"{video_id}/sharedlivemedia/{sharedlivemedia_id}/{stamp}.{extension}".',
      );
    });

    it('delegates to convertSharedLiveMedia and call updateState', async () => {
      mockConvertSharedLiveMedia.mockImplementation(() =>
        Promise.resolve({ nbPages: 3, extension: 'pdf' }),
      );
      await lambda(
        {
          Records: [
            {
              s3: {
                bucket: { name: 'source bucket' },
                object: {
                  key: 'ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200.pdf',
                },
              },
            },
          ],
        },
        null,
        callback,
      );

      expect(mockConvertSharedLiveMedia).toHaveBeenCalledWith(
        'ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200.pdf',
        'source bucket',
      );
      expect(mockUpdateState).toHaveBeenCalledWith(
        'ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200.pdf',
        'processing',
      );
      expect(mockUpdateState).toHaveBeenCalledWith(
        'ed08da34-7447-4141-96ff-5740315d7b99/sharedlivemedia/c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200.pdf',
        'ready',
        { extension: 'pdf', nbPages: 3 },
      );
      expect(mockUpdateState).toHaveBeenCalledTimes(2);
    });
  });

  describe('called with a depositedfile object', () => {
    it('reports an error when a depositedfile has an unexpected format', () => {
      lambda(
        {
          Records: [
            {
              s3: {
                bucket: { name: 'source bucket' },
                object: {
                  key: '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/depositedfile/dba1512e-d0b3-40cc-ae44-722fbe8cba6a',
                },
              },
            },
          ],
        },
        null,
        callback,
      );
      expect(callback).toHaveBeenCalledWith(
        'Source depositedfile should be uploaded to a folder of the form ' +
          '"{file-deposit_id}/depositedfile/{depositedfile_id}/{stamp}".',
      );
    });

    it('delegates to copyDepositFile', async () => {
      mockScanDepositedFile.mockImplementation(() =>
        Promise.resolve({ extension: 'pdf' }),
      );
      await lambda(
        {
          Records: [
            {
              s3: {
                bucket: { name: 'source bucket' },
                object: {
                  key: '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/depositedfile/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735',
                },
              },
            },
          ],
        },
        null,
        callback,
      );

      expect(mockScanDepositedFile).toHaveBeenCalledWith(
        '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/depositedfile/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735',
        'source bucket',
      );
    });

    it('delegates to copyDepositFile and reports an error when thrown', async () => {
      const error = new Error('Something went wrong');
      mockScanDepositedFile.mockImplementation(() => {
        throw error;
      });

      await lambda(
        {
          Records: [
            {
              s3: {
                bucket: { name: 'source bucket' },
                object: {
                  key: '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/depositedfile/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735',
                },
              },
            },
          ],
        },
        null,
        callback,
      );

      expect(mockScanDepositedFile).toHaveBeenCalledWith(
        '630dfaaa-8b1c-4d2e-b708-c9a2d715cf59/depositedfile/dba1512e-d0b3-40cc-ae44-722fbe8cba6a/1542967735',
        'source bucket',
      );
      expect(callback).toHaveBeenCalledWith(error);
    });
  });

  describe('called with a classroomdocument object', () => {
    it('reports an error when a classroomdocument has an unexpected format', () => {
      lambda(
        {
          Records: [
            {
              s3: {
                bucket: { name: 'source bucket' },
                object: {
                  key: 'ed08da34-7447-4141-96ff-5740315d7b99/classroomdocument/c5cad053-111a-4e0e-8f78-fe43dec11512',
                },
              },
            },
          ],
        },
        null,
        callback,
      );
      expect(callback).toHaveBeenCalledWith(
        'Source classroomdocument should be uploaded to a folder of the form ' +
          '"{classroom_id}/classroomdocument/{classroomdocument_id}/{stamp}".',
      );
    });

    it('delegates to copyClassroomdocument and call updateState', async () => {
      mockCopyClassroomDocument.mockImplementation(() => Promise.resolve());
      await lambda(
        {
          Records: [
            {
              s3: {
                bucket: { name: 'source bucket' },
                object: {
                  key: 'ed08da34-7447-4141-96ff-5740315d7b99/classroomdocument/c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200.pdf',
                },
              },
            },
          ],
        },
        null,
        callback,
      );

      expect(mockCopyClassroomDocument).toHaveBeenCalledWith(
        'ed08da34-7447-4141-96ff-5740315d7b99/classroomdocument/c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200.pdf',
        'source bucket',
      );
      expect(mockUpdateState).toHaveBeenCalledWith(
        'ed08da34-7447-4141-96ff-5740315d7b99/classroomdocument/c5cad053-111a-4e0e-8f78-fe43dec11512/1638403200.pdf',
        'ready',
      );
    });
  });
});

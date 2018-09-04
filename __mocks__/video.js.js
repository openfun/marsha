const videojs = jest.fn();

videojs.mockReturnValue({
  dispose: jest.fn(),
});

module.exports = videojs;

const Plyr = jest.fn();

Plyr.mockImplementation(() => ({
  destroy: jest.fn(),
  pause: jest.fn(),
  play: jest.fn(),
  togglePlay: jest.fn(),
}));

module.exports = Plyr;

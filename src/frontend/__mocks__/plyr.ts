const Plyr = jest.fn() as typeof Plyr;

(Plyr as any).mockImplementation(() => ({
  destroy: jest.fn(),
  pause: jest.fn(),
  play: jest.fn(),
  togglePlay: jest.fn(),
}));

module.exports = Plyr;

const spyLog = jest.spyOn(console, 'log');
const spyError = jest.spyOn(console, 'error');

describe('lambda', () => {
  beforeEach(() => {
    jest.resetModules()
    spyLog.mockReset();
    spyLog.mockReset();
    jest.resetAllMocks();
  });
  afterAll(() => {
    spyLog.mockRestore();
    spyError.mockRestore();
  });

  it('should execute nothing if MIGRATIONS env is missing', async () => {
    const lambda = require('./index.js').handler;
    await lambda(null, null, jest.fn());
  });

  it('should execute only existing migrations', async () => {
    process.env.MIGRATIONS = ' 0001_migration,foo';
    const lambda = require('./index.js').handler;
    await lambda(null, null, jest.fn());
    expect(spyError).toHaveBeenCalledWith('migration ./stubs/migrations/foo.js does not exists');
    expect(spyLog).toHaveBeenNthCalledWith(1, 'executing migration ./stubs/migrations/0001_migration.js');
    expect(spyLog).toHaveBeenNthCalledWith(2, 'foo');
    expect(spyLog).toHaveBeenNthCalledWith(3, 'end migration ./stubs/migrations/0001_migration.js');
  });
});

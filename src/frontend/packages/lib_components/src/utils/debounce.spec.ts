import { debounce } from './debounce';

const debouncedfunction = jest.fn();

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(global, 'clearTimeout');
    jest.spyOn(global, 'setTimeout');
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  it('gives a function to debounce and executes its return', () => {
    const returnedfunction = debounce<any>(debouncedfunction);
    expect(clearTimeout).toHaveBeenCalledTimes(0);
    expect(setTimeout).toHaveBeenCalledTimes(0);

    returnedfunction({ title: 'generic title' });
    expect(clearTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(debouncedfunction).toHaveBeenCalledTimes(0);

    jest.advanceTimersByTime(500);
    expect(debouncedfunction).toHaveBeenCalledTimes(1);
    expect(debouncedfunction).toHaveBeenCalledWith({ title: 'generic title' });
  });

  it('gives a function to debounce and executes several times its return', () => {
    const returnedfunction = debounce<any>(debouncedfunction);
    expect(clearTimeout).toHaveBeenCalledTimes(0);
    expect(setTimeout).toHaveBeenCalledTimes(0);

    returnedfunction({ title: 'generic title' });
    expect(clearTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(debouncedfunction).toHaveBeenCalledTimes(0);
    jest.advanceTimersByTime(100);

    returnedfunction({ title: 'generic title' });
    expect(clearTimeout).toHaveBeenCalledTimes(2);
    expect(setTimeout).toHaveBeenCalledTimes(2);
    expect(debouncedfunction).toHaveBeenCalledTimes(0);
    jest.advanceTimersByTime(100);

    returnedfunction({ title: 'generic title' });
    expect(clearTimeout).toHaveBeenCalledTimes(3);
    expect(setTimeout).toHaveBeenCalledTimes(3);
    expect(debouncedfunction).toHaveBeenCalledTimes(0);
    jest.advanceTimersByTime(100);

    returnedfunction({ title: 'generic title' });
    expect(clearTimeout).toHaveBeenCalledTimes(4);
    expect(setTimeout).toHaveBeenCalledTimes(4);
    expect(debouncedfunction).toHaveBeenCalledTimes(0);
    jest.advanceTimersByTime(100);

    jest.advanceTimersByTime(500);
    expect(debouncedfunction).toHaveBeenCalledTimes(1);
    expect(debouncedfunction).toHaveBeenCalledWith({ title: 'generic title' });
  });
});

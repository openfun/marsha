import { isLocalStorageEnabled } from '.';

let storage: {
  [key in string]?: string;
} = {};

describe('isLocalStorageEnabled()', () => {
  beforeAll(() => {
    global.window ??= Object.create(window);
  });

  beforeEach(() => {
    storage = {};
    jest.clearAllMocks();
  });

  it('returns true if localstorage is available', () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (item: string) => storage[item] || null,
        removeItem: (item: string) => delete storage[item],
        setItem: (item: string, value: string) => (storage[item] = value),
      },
      writable: true,
    });

    expect(isLocalStorageEnabled()).toEqual(true);
  });

  it('returns false if we fail to write in the localstorage', () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (item: string) => storage[item] || null,
        removeItem: (item: string) => delete storage[item],
        setItem: (_item: string, _value: string) => {
          throw new Error('failed');
        },
      },
      writable: true,
    });

    expect(isLocalStorageEnabled()).toEqual(false);
  });

  it('returns false if we fail to read in the localstorage', () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (item: string) => storage[item] || null,
        removeItem: (_item: string) => {
          throw new Error('failed');
        },
        setItem: (item: string, value: string) => (storage[item] = value),
      },
      writable: true,
    });

    expect(isLocalStorageEnabled()).toEqual(false);
  });
});

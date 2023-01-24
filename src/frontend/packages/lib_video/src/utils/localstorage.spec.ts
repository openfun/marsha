import { isLocalStorageEnabled, report } from 'lib-components';
import { v4 as uuidv4 } from 'uuid';

import {
  ANONYMOUS_ID_KEY,
  getAnonymousId,
  setAnonymousId,
} from './localstorage';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
  isLocalStorageEnabled: jest.fn(),
}));
const mockReport = report as jest.MockedFunction<typeof report>;
const mockedIsLocalstorageEnabled =
  isLocalStorageEnabled as jest.MockedFunction<typeof isLocalStorageEnabled>;

let storage: {
  [key in string]?: string;
} = {};

const defineLocaleStorage = () => {
  global.window = Object.create(window);
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (item: string) => storage[item] || null,
      removeItem: (item: string) => delete storage[item],
      setItem: (item: string, value: string) => (storage[item] = value),
    },
    writable: true,
  });
};

describe('getAnonymousId and setAnonymousId', () => {
  beforeAll(() => {
    defineLocaleStorage();
  });

  beforeEach(() => {
    storage = {};
    jest.clearAllMocks();
  });

  it('returns a previously set anonymous_id', () => {
    mockedIsLocalstorageEnabled.mockReturnValue(true);

    const anonymousId = uuidv4();
    storage[ANONYMOUS_ID_KEY] = anonymousId;
    expect(getAnonymousId()).toEqual(anonymousId);
    expect(mockReport).not.toHaveBeenCalled();
  });

  it('sets an anonymousId with no previous anonymousId', () => {
    mockedIsLocalstorageEnabled.mockReturnValue(true);

    const anonymousId = uuidv4();
    setAnonymousId(anonymousId);
    expect(getAnonymousId()).toEqual(anonymousId);
    expect(mockReport).not.toHaveBeenCalled();
  });

  it('sets an anonymousId with a previous anonymousId', () => {
    mockedIsLocalstorageEnabled.mockReturnValue(true);

    const anonymousId = uuidv4();
    storage[ANONYMOUS_ID_KEY] = anonymousId;
    expect(getAnonymousId()).toEqual(anonymousId);

    const newAnonymousId = uuidv4();
    setAnonymousId(newAnonymousId);
    expect(getAnonymousId()).toEqual(newAnonymousId);
    expect(mockReport).not.toHaveBeenCalled();
  });

  it('returns a newly generated anonymous_id if not already present in the localstorage', () => {
    mockedIsLocalstorageEnabled.mockReturnValue(true);

    expect(storage[ANONYMOUS_ID_KEY]).toBeUndefined();
    const anonymousId = getAnonymousId();
    expect(storage[ANONYMOUS_ID_KEY]).toEqual(anonymousId);
    expect(mockReport).not.toHaveBeenCalled();
  });

  it('returns a newly generated anonymous_id and report the error if localstorage.setItems throws an error', () => {
    mockedIsLocalstorageEnabled.mockReturnValue(true);

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (item: string) => storage[item] || null,
        removeItem: (item: string) => delete storage[item],
        setItem: () => {
          throw Error('not implemented');
        },
      },
      writable: true,
    });

    expect(storage.anonymous_id).toBeUndefined();
    const anonymousId = getAnonymousId();
    expect(anonymousId).not.toBeNull();
    expect(mockReport).toHaveBeenCalled();
    expect(storage.anonymous_id).toBeUndefined();
  });

  it('returs a newly generated anonymous_id and do not report the error if localstorage is disable', () => {
    mockedIsLocalstorageEnabled.mockReturnValue(false);

    expect(storage.anonymous_id).toBeUndefined();
    const anonymousId = getAnonymousId();
    expect(anonymousId).not.toBeNull();
    expect(mockReport).not.toHaveBeenCalled();
    expect(storage.anonymous_id).toBeUndefined();
  });

  it('does not save anonymous_id in the localstorage if it is disable', () => {
    mockedIsLocalstorageEnabled.mockReturnValue(false);

    setAnonymousId('some id');
    expect(storage.anonymous_id).toBeUndefined();
  });
});

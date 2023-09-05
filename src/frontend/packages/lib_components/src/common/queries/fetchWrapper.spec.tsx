import fetchMock from 'fetch-mock';

import { fetchReconnectWrapper } from './fetchReconnectWrapper';
import { fetchWrapper } from './fetchWrapper';

jest.mock('./fetchReconnectWrapper', () => ({
  ...jest.requireActual('./fetchReconnectWrapper'),
  fetchReconnectWrapper: jest.fn(),
}));
const mockedFetchReconnectWrapper =
  fetchReconnectWrapper as jest.MockedFunction<typeof fetchReconnectWrapper>;

describe('fetchWrapper', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('loads correctly fetchReconnectWrapper', () => {
    fetchWrapper(
      'some request',
      { body: 'some body' },
      {
        withoutReconnectWrapper: false,
        optionsReconnectWrapper: { isRetry: true },
      },
    );

    expect(mockedFetchReconnectWrapper).toHaveBeenCalled();
    expect(mockedFetchReconnectWrapper).toHaveBeenCalledWith(
      'some request',
      { body: 'some body', headers: { 'Accept-Language': 'en' } },
      { isRetry: true },
    );

    expect(fetchMock.calls().length).toEqual(0);
  });

  it('loads without reconnect wrapper option', () => {
    fetchMock.mock('http://some.url.com', 200);

    fetchWrapper(
      'http://some.url.com',
      { body: 'some body', method: 'POST' },
      {
        withoutReconnectWrapper: true,
      },
    );

    expect(mockedFetchReconnectWrapper).not.toHaveBeenCalled();

    expect(fetchMock.calls().length).toEqual(1);
    expect(fetchMock.calls()[0][0]).toEqual('http://some.url.com/');
    expect(fetchMock.calls()[0][1]).toEqual({
      body: 'some body',
      method: 'POST',
      headers: {
        'Accept-Language': 'en',
      },
    });
  });

  it('let the header language if already set', () => {
    fetchMock.mock('http://some.url.com', 200);

    fetchWrapper(
      'http://some.url.com',
      {
        headers: { 'Accept-Language': 'test' },
      },
      {
        withoutReconnectWrapper: true,
      },
    );

    expect(fetchMock.calls().length).toEqual(1);
    expect(fetchMock.calls()[0][1]).toEqual({
      headers: {
        'Accept-Language': 'test',
      },
    });
  });
});

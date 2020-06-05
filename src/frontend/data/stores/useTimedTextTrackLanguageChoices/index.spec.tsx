import { act, render } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import {
  useTimedTextTrackLanguageChoices,
  useTimedTextTrackLanguageChoicesApi,
} from '.';
import { requestStatus } from '../../../types/api';
import { report } from '../../../utils/errors/report';

jest.mock('../../appData', () => ({
  appData: { jwt: 'some token' },
}));

jest.mock('../../../utils/errors/report', () => ({ report: jest.fn() }));

describe('stores/useTimedTextTrackLanguageChoices', () => {
  // Build a helper component with an out-of-scope function to let us reach our Hook from
  // our test cases.
  let getLatestHookValues: any;
  const TestComponent = () => {
    const hookValues = useTimedTextTrackLanguageChoices();
    getLatestHookValues = () => hookValues;
    return <div />;
  };

  beforeEach(() => {
    useTimedTextTrackLanguageChoicesApi.setState({ choices: undefined });
  });

  afterEach(() => fetchMock.restore());

  it('gets the choices the first time getChoices is called and makes them available', async () => {
    fetchMock.mock(
      '/api/timedtexttracks/',
      {
        actions: {
          POST: {
            language: {
              choices: [
                { display_name: 'English', value: 'en' },
                { display_name: 'French', value: 'fr' },
              ],
            },
          },
        },
      },
      { method: 'OPTIONS' },
    );
    render(<TestComponent />);

    {
      const { choices, getChoices } = getLatestHookValues();
      expect(choices).toEqual(undefined);
      await act(async () => {
        expect(await getChoices()).toEqual(requestStatus.SUCCESS);
      });
      expect(fetchMock.calls().length).toEqual(1);
      expect(fetchMock.lastCall()![0]).toEqual('/api/timedtexttracks/');
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: { Authorization: 'Bearer some token' },
        method: 'OPTIONS',
      });
    }
    {
      const { choices, getChoices } = getLatestHookValues();
      expect(choices).toEqual([
        { label: 'English', value: 'en' },
        { label: 'French', value: 'fr' },
      ]);
      await act(async () => {
        expect(await getChoices()).toEqual(requestStatus.SUCCESS);
      });
      expect(fetchMock.calls().length).toEqual(1);
    }
  });

  it('reports the error and resolves with a failure when it cannot get the choices', async () => {
    fetchMock.mock('/api/timedtexttracks/', 500, { method: 'OPTIONS' });
    render(<TestComponent />);

    {
      const { choices, getChoices } = getLatestHookValues();
      expect(choices).toEqual(undefined);
      await act(async () => {
        expect(await getChoices()).toEqual(requestStatus.FAILURE);
      });
      expect(fetchMock.calls().length).toEqual(1);
      expect(fetchMock.lastCall()![0]).toEqual('/api/timedtexttracks/');
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: { Authorization: 'Bearer some token' },
        method: 'OPTIONS',
      });
      expect(report).toHaveBeenCalledWith(
        new Error('Failed to fetch OPTIONS /api/timedtexttracks/'),
      );
    }
  });
});

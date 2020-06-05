import { render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { defineMessages } from 'react-intl';

import { DashboardTimedTextManager } from '.';
import { TimedText, timedTextMode, uploadState } from '../../types/tracks';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';

jest.mock('jwt-decode', () => jest.fn());

jest.mock('../../data/appData', () => ({
  appData: {
    jwt: 'foo',
  },
}));

describe('<DashboardTimedTextManager />', () => {
  it('renders the message & tracks it is passed', async () => {
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

    const message = defineMessages({
      key: {
        defaultMessage: 'Our title',
        description: '',
        id: 'message.key',
      },
    });

    const tracks = [
      {
        id: '42',
        language: 'fr',
        mode: timedTextMode.TRANSCRIPT,
        upload_state: uploadState.READY,
      } as TimedText,
      {
        id: '43',
        language: 'en',
        mode: timedTextMode.TRANSCRIPT,
        upload_state: uploadState.READY,
      } as TimedText,
    ];

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardTimedTextManager
            message={message.key}
            mode={timedTextMode.TRANSCRIPT}
            tracks={tracks}
          />,
        ),
      ),
    );

    screen.getByText('Our title')

    await screen.findByText('French');
    screen.getByText('English');
  });
});

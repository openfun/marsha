import { render, wait } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { defineMessages } from 'react-intl';
import { Provider } from 'react-redux';

import { DashboardTimedTextManager } from '.';
import { bootstrapStore } from '../../data/bootstrapStore';
import { appState } from '../../types/AppData';
import { TimedText, timedTextMode, uploadState } from '../../types/tracks';
import { wrapInRouter } from '../../utils/tests/router';

jest.mock('jwt-decode', () => jest.fn());

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

    const state = {
      jwt: 'jwt-token',
      state: appState.INSTRUCTOR,
      video: {
        id: 'dd44',
        thumbnail: null,
        timed_text_tracks: tracks,
        upload_state: uploadState.READY,
      },
    } as any;

    const { getByText } = render(
      <Provider store={bootstrapStore(state)}>
        {wrapInRouter(
          <DashboardTimedTextManager
            message={message.key}
            mode={timedTextMode.TRANSCRIPT}
            tracks={tracks}
          />,
        )}
      </Provider>,
    );

    await wait();

    getByText('Our title');
    getByText('French');
    getByText('English');
  });
});

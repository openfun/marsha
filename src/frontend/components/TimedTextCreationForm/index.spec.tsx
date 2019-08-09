import { fireEvent, render, wait } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import { TimedTextCreationForm } from '.';
import { timedTextMode, uploadState } from '../../types/tracks';
import { report } from '../../utils/errors/report';
import { wrapInRouter } from '../../utils/tests/router';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';

jest.mock('../../utils/errors/report', () => ({ report: jest.fn() }));
jest.mock('../../data/appData', () => ({ appData: { jwt: 'some token' } }));

describe('<TimedTextCreationForm />', () => {
  beforeEach(() => {
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
  });

  afterEach(fetchMock.restore);
  afterEach(jest.resetAllMocks);

  it('renders and loads the language choices', async () => {
    const { getByText } = render(
      <TimedTextCreationForm
        excludedLanguages={['en']}
        mode={timedTextMode.SUBTITLE}
      />,
    );

    await wait();

    getByText('Add a language');
    getByText('Select...');
    expect(
      fetchMock.calls('/api/timedtexttracks/', { method: 'OPTIONS' }).length,
    ).toEqual(1);
  });

  it('creates a timedtexttrack, adds it to store and retirects to the upload form', async () => {
    fetchMock.mock(
      '/api/timedtexttracks/',
      {
        active_stamp: null,
        id: '42',
        is_ready_to_play: false,
        language: 'en',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.PENDING,
        url: '',
        video: {} as any,
      },
      { method: 'POST' },
    );

    const { container, getByText } = render(
      wrapInRouter(
        <TimedTextCreationForm
          excludedLanguages={['en']}
          mode={timedTextMode.SUBTITLE}
        />,
        [
          {
            path: UPLOAD_FORM_ROUTE(),
            render: ({ match }) => (
              <span>{`Upload form: ${match.params.objectType} ${match.params.objectId}`}</span>
            ),
          },
        ],
      ),
    );
    await wait();

    getByText('Select...');
    const input = container.querySelector('input');
    fireEvent.change(input!, { target: { value: 'French' } });
    fireEvent.keyDown(input!, { keyCode: 9, key: 'Tab' });
    fireEvent.click(getByText('French'));

    const button = getByText('Upload the file');
    fireEvent.click(button);

    expect(
      fetchMock.calls('/api/timedtexttracks/', { method: 'POST' }).length,
    ).toEqual(1);
    expect(
      fetchMock.lastCall('/api/timedtexttracks/', { method: 'POST' })![1],
    ).toEqual({
      body: '{"language":"fr","mode":"st"}',
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    await wait();
    getByText('Upload form: timedtexttracks 42');
  });

  it('shows an error message and reports the error when it fails to create a timedtexttrack', async () => {
    fetchMock.mock('/api/timedtexttracks/', 500, { method: 'POST' });

    const { container, getByText } = render(
      wrapInRouter(
        <TimedTextCreationForm
          excludedLanguages={['en']}
          mode={timedTextMode.SUBTITLE}
        />,
        [
          {
            path: ERROR_COMPONENT_ROUTE(),
            render: ({ match }) => (
              <span>{`Error Component: ${match.params.code}`}</span>
            ),
          },
        ],
      ),
    );
    await wait();
    const input = container.querySelector('input');
    fireEvent.change(input!, { target: { value: 'French' } });
    fireEvent.keyDown(input!, { keyCode: 9, key: 'Tab' });
    fireEvent.click(getByText('French'));

    const button = getByText('Upload the file');
    fireEvent.click(button);

    await wait();

    getByText('There was an error during track creation.');
    expect(report).toHaveBeenCalledWith(
      new Error('Failed to create a new TimedTextTrack with fr, st: 500.'),
    );
  });
});

import { fireEvent, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import React from 'react';

import { FULL_SCREEN_ERROR_ROUTE } from 'lib-components';
import { UPLOAD_FORM_ROUTE } from 'components/UploadForm/route';
import { timedTextMode, uploadState } from 'lib-components';
import { report } from 'lib-components';
import render from 'utils/tests/render';

import { TimedTextCreationForm } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('<TimedTextCreationForm />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
    });

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

  afterEach(() => fetchMock.restore());
  afterEach(jest.resetAllMocks);

  it('renders and loads the language choices', async () => {
    render(
      <TimedTextCreationForm
        excludedLanguages={['en']}
        mode={timedTextMode.SUBTITLE}
      />,
    );
    await screen.findByText('Add a language');

    screen.getByText('Select...');
    expect(
      fetchMock.calls('/api/timedtexttracks/', { method: 'OPTIONS' }).length,
    ).toEqual(1);
  });

  it('creates a timedtexttrack, adds it to store and redirects to the upload form', async () => {
    fetchMock.mock(
      '/api/timedtexttracks/',
      {
        active_stamp: null,
        id: '42',
        is_ready_to_show: false,
        language: 'en',
        mode: timedTextMode.SUBTITLE,
        upload_state: uploadState.PENDING,
        url: '',
        video: {} as any,
      },
      { method: 'POST' },
    );

    render(
      <TimedTextCreationForm
        excludedLanguages={['en']}
        mode={timedTextMode.SUBTITLE}
      />,
      {
        routerOptions: {
          routes: [
            {
              path: UPLOAD_FORM_ROUTE(),
              render: ({ match }) => (
                <span>{`Upload form: ${match.params.objectType} ${match.params.objectId}`}</span>
              ),
            },
          ],
        },
      },
    );
    await screen.findByText('Add a language');

    screen.getByText('Select...');
    const input = screen.getByRole('combobox');
    fireEvent.change(input!, { target: { value: 'French' } });
    fireEvent.keyDown(input!, { keyCode: 9, key: 'Tab' });
    fireEvent.click(screen.getByText('French'));

    const button = screen.getByRole('button', { name: /Upload the file/i });
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
    await screen.findByText('Upload form: timedtexttracks 42');
  });

  it('shows an error message and reports the error when it fails to create a timedtexttrack', async () => {
    fetchMock.mock('/api/timedtexttracks/', 500, { method: 'POST' });

    render(
      <TimedTextCreationForm
        excludedLanguages={['en']}
        mode={timedTextMode.SUBTITLE}
      />,
      {
        routerOptions: {
          routes: [
            {
              path: FULL_SCREEN_ERROR_ROUTE(),
              render: ({ match }) => (
                <span>{`Error Component: ${match.params.code}`}</span>
              ),
            },
          ],
        },
      },
    );
    await screen.findByText('Add a language');

    const input = screen.getByRole('combobox');
    fireEvent.change(input!, { target: { value: 'French' } });
    fireEvent.keyDown(input!, { keyCode: 9, key: 'Tab' });
    fireEvent.click(screen.getByText('French'));

    const button = screen.getByRole('button', { name: /Upload the file/i });
    fireEvent.click(button);

    await screen.findByText('There was an error during track creation.');

    expect(report).toHaveBeenCalledWith(
      new Error('Failed to create a new TimedTextTrack with fr, st: 500.'),
    );
  });
});

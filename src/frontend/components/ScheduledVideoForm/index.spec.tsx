import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Grommet } from 'grommet';
import fetchMock from 'fetch-mock';
import React, { Suspense } from 'react';

import { LiveModeType, uploadState } from '../../types/tracks';
import { Deferred } from '../../utils/tests/Deferred';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';
import { ScheduledVideoForm } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('../../data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

describe('<ScheduledVideoForm />', () => {
  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });
  const startingAt = new Date();
  startingAt.setFullYear(startingAt.getFullYear() + 1);
  startingAt.setHours(10);
  startingAt.setMinutes(0);
  startingAt.setSeconds(0);

  const video = videoMockFactory({
    is_ready_to_show: true,
    show_download: true,
    thumbnail: null,
    timed_text_tracks: [],
    title: '',
    upload_state: uploadState.PENDING,
    urls: {
      manifests: {
        hls: 'https://example.com/hls',
      },
      mp4: {},
      thumbnails: {},
    },
    should_use_subtitle_as_transcript: false,
    live_info: {
      medialive: {
        input: {
          endpoints: [
            'rtmp://1.2.3.4:1935/stream-key-primary',
            'rtmp://4.3.2.1:1935/stream-key-secondary',
          ],
        },
      },
    },
    live_type: LiveModeType.RAW,
  });

  it('shows the scheduling form', async () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Grommet>
            <ScheduledVideoForm video={{ ...video }} />
          </Grommet>,
        ),
      ),
    );
    screen.getByRole('heading', { name: /schedule a webinar/i });
    screen.getByRole('textbox', { name: /title of your webinar/i });
    screen.getByRole('textbox', { name: /description of your webinar/i });
    screen.getByText(/what is the scheduled date and time of your webinar \?/i);
    screen.getByRole('textbox', {
      name: /what is the scheduled date and time of your webinar \?/i,
    });
    screen.getByRole('button', { name: /submit/i });
  });

  it('loads video with prefilled datas', async () => {
    render(
      wrapInIntlProvider(
        <Grommet>
          <ScheduledVideoForm
            video={{
              ...video,
              title: 'This is the title',
              description: 'This is the description',
              starting_at: startingAt.toISOString(),
            }}
          />
        </Grommet>,
      ),
    );

    screen.getByDisplayValue('This is the title');
    screen.getByDisplayValue('This is the description');
    screen.getByRole('heading', {
      name: `Webinar is scheduled at ${startingAt.toLocaleString()}.`,
    });
    screen.getByDisplayValue(
      `${startingAt.getDate()}/${
        startingAt.getMonth() + 1
      }/${startingAt.getFullYear()} 10:00 AM`,
    );
  });

  it('updates video and shows effective changes', async () => {
    const deferred = new Deferred();

    fetchMock.mock('/api/videos/55/', deferred.promise, { method: 'PUT' });
    const { getByText } = render(
      wrapInIntlProvider(
        <Grommet>
          <ScheduledVideoForm
            video={{
              ...video,
              id: '55',
            }}
          />
        </Grommet>,
      ),
    );

    const inputTitle = screen.getByRole('textbox', {
      name: /title of your webinar/i,
    });
    const inputDate = screen.getByRole('textbox', {
      name: /what is the scheduled date and time of your webinar \?/i,
    });
    const inputDescription = screen.getByRole('textbox', {
      name: /description of your webinar/i,
    });

    fireEvent.change(inputTitle, { target: { value: 'Webinar on Maths' } });
    fireEvent.change(inputDate, { target: { value: startingAt } });
    fireEvent.change(inputDescription, {
      target: { value: 'A very nice one' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    const startingAtUTC = `${startingAt.getUTCFullYear()}-${
      startingAt.getUTCMonth() + 1
    }-${startingAt.getUTCDate()}T${startingAt.getUTCHours()}:${startingAt.getUTCMinutes()}`;

    await waitFor(() => {
      expect(fetchMock.called('/api/videos/55/', { method: 'PUT' })).toEqual(
        true,
      );
    });
    expect(fetchMock.lastOptions('/api/videos/55/')!.body).toEqual(
      JSON.stringify({
        title: 'Webinar on Maths',
        description: 'A very nice one',
        starting_at: startingAtUTC,
      }),
    );
    await act(async () =>
      deferred.resolve(
        JSON.stringify({
          ...video,
          title: 'Webinar on Maths',
          description: 'A very nice one',
          starting_at: startingAt,
        }),
      ),
    );

    screen.getByRole('heading', {
      name: `Webinar is scheduled at ${startingAt.toLocaleString()}.`,
    });
    getByText(/your webinar has been updated/i);
    getByText(/your can now ask users to register to your webinar/i);

    screen.getByDisplayValue('Webinar on Maths');
    screen.getByDisplayValue('A very nice one');
    screen.getByDisplayValue(
      `${startingAt.getDate()}/${
        startingAt.getMonth() + 1
      }/${startingAt.getFullYear()} 10:00 AM`,
    );
  });

  it('indicates when starting_at date is past', async () => {
    const dateInThePast = new Date();
    dateInThePast.setFullYear(dateInThePast.getFullYear() - 10);

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <ScheduledVideoForm
              video={{
                ...video,
                starting_at: dateInThePast.toISOString(),
              }}
            />
          </Suspense>,
        ),
      ),
    );
    screen.getByRole('heading', {
      name: `Webinar was scheduled at ${dateInThePast.toLocaleString()}.`,
    });
    screen.getByText(
      /date is past, please, create a new webinar or start this one/i,
    );

    // no form is loaded anymore
    expect(
      screen.queryByRole('button', { name: /submit/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toEqual(null);
    expect(
      screen.queryByRole('heading', { name: /schedule a webinar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: /title of your webinar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', {
        name: /description of your webinar/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole(
        /what is the scheduled date and time of your webinar \?/i,
      ),
    ).not.toBeInTheDocument();
  });

  it('fails to update video and error messages are displayed', async () => {
    const deferred = new Deferred();

    fetchMock.mock('/api/videos/55/', deferred.promise, { method: 'PUT' });

    const { container, getByText } = render(
      wrapInIntlProvider(
        <Grommet>
          <ScheduledVideoForm
            video={{
              ...video,
              id: '55',
            }}
          />
        </Grommet>,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(fetchMock.called('/api/videos/55/', { method: 'PUT' })).toBe(true);
    await act(async () => deferred.resolve(500));
    getByText(
      'An error occured while updating the scheduled event, please try again.',
    );
  });

  it('fails to update video if date is not defined', async () => {
    const deferred = new Deferred();
    fetchMock.mock('/api/videos/55/', deferred.promise, { method: 'PUT' });

    const { queryAllByText, getByText } = render(
      wrapInIntlProvider(
        <Grommet>
          <ScheduledVideoForm
            video={{
              ...video,
              title: 'Maths',
              id: '55',
            }}
          />
        </Grommet>,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(fetchMock.called('/api/videos/55/', { method: 'PUT' })).toBe(true);
    await act(async () =>
      deferred.resolve({
        status: 400,
        body: { starting_at: 'bad date' },
      }),
    );
    expect(
      queryAllByText(
        /scheduled date must be in the future and have a date and hour defined\./i,
      ).length,
    ).toBe(2);

    getByText(
      'An error occured while updating the scheduled event, please try again.',
    );
  });

  it('fails to update video if title is not defined', async () => {
    const deferred = new Deferred();
    fetchMock.mock('/api/videos/55/', deferred.promise, { method: 'PUT' });

    const { queryAllByText, getByRole, getByText } = render(
      wrapInIntlProvider(
        <Grommet>
          <ScheduledVideoForm
            video={{
              ...video,
              starting_at: startingAt.toISOString(),
              id: '55',
            }}
          />
        </Grommet>,
      ),
    );
    fireEvent.click(getByRole('button', { name: /submit/i }));

    expect(fetchMock.called('/api/videos/55/', { method: 'PUT' })).toBe(true);
    await act(async () =>
      deferred.resolve({
        status: 400,
        body: { title: 'bad title' },
      }),
    );
    expect(queryAllByText(/title must be defined\./i).length).toBe(2);
    getByText(
      'An error occured while updating the scheduled event, please try again.',
    );
  });

  it('fails to update video because of date and title and error messages are displayed', async () => {
    const deferred = new Deferred();

    fetchMock.mock('/api/videos/55/', deferred.promise, { method: 'PUT' });

    const { getByText, getByRole, queryAllByText } = render(
      wrapInIntlProvider(
        <Grommet>
          <ScheduledVideoForm
            video={{
              ...video,
              id: '55',
            }}
          />
        </Grommet>,
      ),
    );
    fireEvent.click(getByRole('button', { name: /submit/i }));

    expect(fetchMock.called('/api/videos/55/', { method: 'PUT' })).toBe(true);

    await act(async () =>
      deferred.resolve({
        status: 400,
        body: { title: 'wrong title', starting_at: 'bad date' },
      }),
    );

    expect(queryAllByText(/title must be defined\./i).length).toBe(2);

    expect(
      queryAllByText(
        /scheduled date must be in the future and have a date and hour defined\./i,
      ).length,
    ).toBe(2);

    getByText(
      'An error occured while updating the scheduled event, please try again.',
    );
    getByText(
      /scheduled date must be in the future and have a date and hour defined\. title must be defined\./i,
    );
  });
});

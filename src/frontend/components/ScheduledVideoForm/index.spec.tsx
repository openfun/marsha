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

import { Deferred } from 'utils/tests/Deferred';
import { useVideo } from 'data/stores/useVideo';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';
import { ScheduledVideoForm } from '.';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));
jest.mock('index', () => ({
  intl: {
    locale: 'en',
  },
}));
jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
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

  const video = videoMockFactory();

  it('shows the scheduling form', async () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Grommet>
            <ScheduledVideoForm video={video} />
          </Grommet>,
        ),
      ),
    );
    screen.getByRole('heading', { name: /schedule/i });
    screen.getByRole('textbox', { name: /title/i });
    screen.getByRole('textbox', { name: /description/i });
    screen.getByText(/starting date and time/i);
    screen.getByRole('textbox', {
      name: /starting date and time/i,
    });
    screen.getByRole('button', { name: /submit/i });
  });

  it('displays video with prefilled datas', () => {
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
      name: `Webinar is scheduled at ${startingAt.toLocaleString('en')}.`,
    });
    screen.getByDisplayValue(
      `${startingAt.getDate()}/${
        startingAt.getMonth() + 1
      }/${startingAt.getFullYear()} 10:00 AM`,
    );
  });

  it('updates video and shows effective changes', async () => {
    const deferred = new Deferred();
    fetchMock.mock(`/api/videos/${video.id}/`, deferred.promise, {
      method: 'PUT',
    });
    const { getByText } = render(
      wrapInIntlProvider(
        <Grommet>
          <ScheduledVideoForm video={video} />
        </Grommet>,
      ),
    );

    const inputTitle = screen.getByRole('textbox', {
      name: /title/i,
    });
    const inputDate = screen.getByRole('textbox', {
      name: /starting date and time/i,
    });
    const inputDescription = screen.getByRole('textbox', {
      name: /description/i,
    });

    fireEvent.change(inputTitle, { target: { value: 'Webinar on Maths' } });
    fireEvent.change(inputDate, { target: { value: startingAt } });
    fireEvent.change(inputDescription, {
      target: { value: 'A very nice one' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(
        fetchMock.called(`/api/videos/${video.id}/`, { method: 'PUT' }),
      ).toEqual(true);
    });
    // force ms to 0 for equality
    startingAt.setSeconds(0, 0);

    expect(fetchMock.lastOptions(`/api/videos/${video.id}/`)!.body).toEqual(
      JSON.stringify({
        title: 'Webinar on Maths',
        description: 'A very nice one',
        starting_at: startingAt.toISOString(),
      }),
    );
    await act(async () =>
      deferred.resolve(
        JSON.stringify({
          ...video,
          title: 'Webinar on Maths',
          description: 'A very nice one',
          starting_at: startingAt.toISOString(),
        }),
      ),
    );

    getByText(/your webinar has been updated/i);
    getByText(/your can now ask users to register to your webinar/i);

    screen.getByDisplayValue('Webinar on Maths');
    screen.getByDisplayValue('A very nice one');
    screen.getByDisplayValue(
      `${startingAt.getDate()}/${
        startingAt.getMonth() + 1
      }/${startingAt.getFullYear()} 10:00 AM`,
    );

    expect(useVideo.getState().videos[video.id]).toEqual({
      ...video,
      title: 'Webinar on Maths',
      description: 'A very nice one',
      starting_at: startingAt.toISOString(),
    });
  });

  it('indicates when starting_at date is past', () => {
    const startingAtPast = new Date();
    startingAtPast.setFullYear(startingAtPast.getFullYear() - 10);
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Suspense fallback="loading...">
            <ScheduledVideoForm
              video={{
                ...video,
                starting_at: startingAtPast.toISOString(),
              }}
            />
          </Suspense>,
        ),
      ),
    );
    screen.getByRole('heading', {
      name: `Webinar was scheduled at ${startingAtPast.toLocaleString('en')}.`,
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
      screen.queryByRole('textbox', { name: /title/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', {
        name: /description/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole(/starting date and time/i),
    ).not.toBeInTheDocument();
  });

  it('fails to update video and error messages are displayed', async () => {
    const deferred = new Deferred();

    fetchMock.mock(`/api/videos/${video.id}/`, deferred.promise, {
      method: 'PUT',
    });

    const { getByText } = render(
      wrapInIntlProvider(
        <Grommet>
          <ScheduledVideoForm
            video={{
              ...video,
              starting_at: startingAt.toISOString(),
              title: 'Maths',
            }}
          />
        </Grommet>,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(
      fetchMock.called(`/api/videos/${video.id}/`, { method: 'PUT' }),
    ).toBe(true);
    await act(async () => deferred.resolve(500));
    getByText(
      'An error occured while updating the scheduled webinar, please try again.',
    );
  });

  it('fails to submit the form because date is not defined', async () => {
    const deferred = new Deferred();
    fetchMock.mock(`/api/videos/${video.id}/`, deferred.promise, {
      method: 'PUT',
    });

    const { queryAllByText, getByText } = render(
      wrapInIntlProvider(
        <Grommet>
          <ScheduledVideoForm
            video={{
              ...video,
              title: 'Maths',
            }}
          />
        </Grommet>,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(
      fetchMock.called(`/api/videos/${video.id}/`, { method: 'PUT' }),
    ).toBe(false);

    expect(
      queryAllByText(
        /scheduled date must be in the future and have a date and hour defined\./i,
      ).length,
    ).toBe(2);

    getByText(
      'An error occured while updating the scheduled webinar, please try again.',
    );
  });

  it('fails to update video if date is not defined', async () => {
    const deferred = new Deferred();
    fetchMock.mock(`/api/videos/${video.id}/`, deferred.promise, {
      method: 'PUT',
    });

    const { queryAllByText, getByText } = render(
      wrapInIntlProvider(
        <Grommet>
          <ScheduledVideoForm
            video={{
              ...video,
              starting_at: startingAt.toISOString(),
              title: 'Maths',
            }}
          />
        </Grommet>,
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(
      fetchMock.called(`/api/videos/${video.id}/`, { method: 'PUT' }),
    ).toBe(true);
    // simulates empty date
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
      'An error occured while updating the scheduled webinar, please try again.',
    );
  });

  it('fails to submit the form because video title is not defined', async () => {
    const deferred = new Deferred();
    fetchMock.mock(`/api/videos/${video.id}/`, deferred.promise, {
      method: 'PUT',
    });

    const { queryAllByText, getByRole, getByText } = render(
      wrapInIntlProvider(
        <Grommet>
          <ScheduledVideoForm
            video={{
              ...video,
              starting_at: startingAt.toISOString(),
            }}
          />
        </Grommet>,
      ),
    );
    const inputTitle = getByRole('textbox', {
      name: /title/i,
    });

    fireEvent.change(inputTitle, { target: { value: '' } });
    fireEvent.click(getByRole('button', { name: /submit/i }));

    expect(
      fetchMock.called(`/api/videos/${video.id}/`, { method: 'PUT' }),
    ).toBe(false);

    expect(queryAllByText(/title must be defined\./i).length).toBe(2);
    getByText(
      'An error occured while updating the scheduled webinar, please try again.',
    );
  });

  it('fails to update the video if the title is not defined', async () => {
    const deferred = new Deferred();

    const { queryAllByText, getByRole, getByText } = render(
      wrapInIntlProvider(
        <Grommet>
          <ScheduledVideoForm
            video={{
              ...video,
              title: 'Fake title',
              starting_at: startingAt.toISOString(),
            }}
          />
        </Grommet>,
      ),
    );
    fetchMock.mock(`/api/videos/${video.id}/`, deferred.promise, {
      method: 'PUT',
    });

    fireEvent.click(getByRole('button', { name: /submit/i }));

    expect(
      fetchMock.called(`/api/videos/${video.id}/`, { method: 'PUT' }),
    ).toBe(true);
    // simulates empty title
    await act(async () =>
      deferred.resolve({
        status: 400,
        body: { title: 'bad title' },
      }),
    );
    expect(queryAllByText(/title must be defined\./i).length).toBe(2);
    getByText(
      'An error occured while updating the scheduled webinar, please try again.',
    );
  });

  it('fails to submit the form because of date and title and error messages are displayed', async () => {
    const deferred = new Deferred();

    fetchMock.mock(`/api/videos/${video.id}/`, deferred.promise, {
      method: 'PUT',
    });

    const { getByText, getByRole, queryAllByText } = render(
      wrapInIntlProvider(
        <Grommet>
          <ScheduledVideoForm video={video} />
        </Grommet>,
      ),
    );
    const inputTitle = getByRole('textbox', {
      name: /title/i,
    });
    const inputDate = getByRole('textbox', {
      name: /starting date and time/i,
    });

    fireEvent.change(inputTitle, { target: { value: '' } });
    fireEvent.change(inputDate, { target: { value: false } });
    fireEvent.click(getByRole('button', { name: /submit/i }));

    expect(
      fetchMock.called(`/api/videos/${video.id}/`, { method: 'PUT' }),
    ).toBe(false);

    expect(queryAllByText(/title must be defined\./i).length).toBe(2);

    expect(
      queryAllByText(
        /scheduled date must be in the future and have a date and hour defined\./i,
      ).length,
    ).toBe(2);

    getByText(
      'An error occured while updating the scheduled webinar, please try again.',
    );
    getByText(
      /scheduled date must be in the future and have a date and hour defined\. title must be defined\./i,
    );
  });

  it('fails to submit the form because the date is past', async () => {
    const deferred = new Deferred();
    const dateInPast = new Date();
    dateInPast.setFullYear(startingAt.getFullYear() - 1);

    fetchMock.mock(`/api/videos/${video.id}/`, deferred.promise, {
      method: 'PUT',
    });

    const { getByText, getByRole, queryAllByText } = render(
      wrapInIntlProvider(
        <Grommet>
          <ScheduledVideoForm video={video} />
        </Grommet>,
      ),
    );
    const inputDate = getByRole('textbox', {
      name: /starting date and time/i,
    });

    fireEvent.change(inputDate, { target: { value: dateInPast } });
    fireEvent.click(getByRole('button', { name: /submit/i }));

    expect(
      fetchMock.called(`/api/videos/${video.id}/`, { method: 'PUT' }),
    ).toBe(false);

    expect(
      queryAllByText(
        /scheduled date must be in the future and have a date and hour defined\./i,
      ).length,
    ).toBe(2);

    getByText(
      'An error occured while updating the scheduled webinar, please try again.',
    );
  });

  it('fails to update video because of date and title and error messages are displayed', async () => {
    const deferred = new Deferred();

    fetchMock.mock(`/api/videos/${video.id}/`, deferred.promise, {
      method: 'PUT',
    });

    const { getByText, getByRole, queryAllByText } = render(
      wrapInIntlProvider(
        <Grommet>
          <ScheduledVideoForm
            video={{
              ...video,
              starting_at: startingAt.toISOString(),
              title: 'Fake title',
            }}
          />
        </Grommet>,
      ),
    );
    fireEvent.click(getByRole('button', { name: /submit/i }));

    expect(
      fetchMock.called(`/api/videos/${video.id}/`, { method: 'PUT' }),
    ).toBe(true);

    // simulates empty title and empty starting_at
    await act(async () =>
      deferred.resolve({
        status: 400,
        body: { starting_at: 'bad date', title: 'wrong title' },
      }),
    );

    expect(queryAllByText(/title must be defined\./i).length).toBe(2);

    expect(
      queryAllByText(
        /scheduled date must be in the future and have a date and hour defined\./i,
      ).length,
    ).toBe(2);

    getByText(
      'An error occured while updating the scheduled webinar, please try again.',
    );
    getByText(
      /scheduled date must be in the future and have a date and hour defined\. title must be defined\./i,
    );
  });
});

import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  InfoWidgetModalProvider,
  useJwt,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { RetentionDate } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('Video <RetentionDate />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('renders the component and set a date with success', async () => {
    const mockedVideo = videoMockFactory();

    fetchMock.mock(`/api/videos/${mockedVideo.id}/`, 200, { method: 'PATCH' });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <RetentionDate />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    expect(screen.getByText('Retention date')).toBeInTheDocument();
    const datePickerInput = screen.getByRole('textbox');

    fireEvent.change(datePickerInput, {
      target: { value: '2020/01/01' },
    });

    expect((datePickerInput as HTMLInputElement).value).toBe('2020/01/01');

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));

    const lastCall = fetchMock.lastCall();
    expect(lastCall).not.toBe(undefined);
    expect(lastCall?.[0]).toBe(`/api/videos/${mockedVideo.id}/`);
    expect(lastCall?.[1]?.body).toEqual('{"retention_date":"2020-01-01"}');
    expect(lastCall?.[1]?.method).toBe('PATCH');
  });

  it('renders the component with a default date and deletes it', async () => {
    const mockedVideo = videoMockFactory({
      retention_date: '2020-01-01',
    });

    fetchMock.mock(`/api/videos/${mockedVideo.id}/`, 200, { method: 'PATCH' });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <RetentionDate />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    expect(screen.getByText('Retention date')).toBeInTheDocument();
    const datePickerInput = await screen.findByRole('textbox');

    expect((datePickerInput as HTMLInputElement).value).toBe('2020/01/01');

    const deleteButton = await screen.findByRole('button', {
      name: 'Delete retention date',
    });

    await userEvent.click(deleteButton);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));

    const lastCall = fetchMock.lastCall();
    expect(lastCall).not.toBe(undefined);
    expect(lastCall?.[0]).toBe(`/api/videos/${mockedVideo.id}/`);
    expect(lastCall?.[1]?.body).toEqual('{"retention_date":null}');
    expect(lastCall?.[1]?.method).toBe('PATCH');
  });

  it('fails to update the video and displays the right error message', async () => {
    // Set by default with an All rights reserved license
    const mockedVideo = videoMockFactory({
      retention_date: '2020-01-01',
    });
    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, 401);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <RetentionDate />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    expect(screen.getByText('Retention date')).toBeInTheDocument();

    const deleteButton = await screen.findByRole('button', {
      name: 'Delete retention date',
    });

    await userEvent.click(deleteButton);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));

    await screen.findByText('Video update has failed!');
  });
});

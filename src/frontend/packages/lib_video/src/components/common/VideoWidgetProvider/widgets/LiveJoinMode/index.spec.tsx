import { within, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  useJwt,
  videoMockFactory,
  report,
  JoinMode,
  InfoWidgetModalProvider,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { LiveJoinMode } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('<LiveJoinMode />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('renders the widget', () => {
    const mockedVideo = videoMockFactory({
      join_mode: JoinMode.APPROVAL,
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <LiveJoinMode />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('Join the discussion');
    const button = screen.getByRole('button', {
      name: /select join the discussion mode/i,
    });
    const select = within(button).getByRole('textbox');
    expect(select).toHaveValue('Accept joining the discussion after approval');
  });

  it('selects join mode denied', async () => {
    const mockedVideo = videoMockFactory({
      join_mode: JoinMode.APPROVAL,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      join_mode: JoinMode.DENIED,
    });

    const { rerender } = render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <LiveJoinMode />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const button = screen.getByRole('button', {
      name: /select join the discussion mode/i,
    });
    const select = within(button).getByRole('textbox');
    expect(select).toHaveValue('Accept joining the discussion after approval');

    userEvent.click(button);
    userEvent.click(screen.getByText(/not allowed/i));

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        join_mode: 'denied',
      }),
    });
    expect(report).not.toHaveBeenCalled();
    await screen.findByText('Video updated.');

    // simulate video update
    rerender(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <LiveJoinMode />
        </InfoWidgetModalProvider>,
        { ...mockedVideo, join_mode: JoinMode.DENIED },
      ),
    );
    expect(within(button).getByRole('textbox')).toHaveValue('Not allowed');
  });

  it('selects join mode ask for approval', async () => {
    const mockedVideo = videoMockFactory({
      join_mode: JoinMode.DENIED,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      join_mode: JoinMode.APPROVAL,
    });

    const { rerender } = render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <LiveJoinMode />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const button = screen.getByRole('button', {
      name: /select join the discussion mode/i,
    });
    const select = within(button).getByRole('textbox');
    expect(select).toHaveValue('Not allowed');

    userEvent.click(button);
    userEvent.click(
      screen.getByText(/Accept joining the discussion after approval/i),
    );

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        join_mode: 'approval',
      }),
    });
    expect(report).not.toHaveBeenCalled();
    await screen.findByText('Video updated.');

    // simulate video update
    rerender(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <LiveJoinMode />
        </InfoWidgetModalProvider>,
        { ...mockedVideo, join_mode: JoinMode.APPROVAL },
      ),
    );
    expect(within(button).getByRole('textbox')).toHaveValue(
      'Accept joining the discussion after approval',
    );
  });

  it('selects join mode forced', async () => {
    const mockedVideo = videoMockFactory({
      join_mode: JoinMode.APPROVAL,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      join_mode: JoinMode.FORCED,
    });

    const { rerender } = render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <LiveJoinMode />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const button = screen.getByRole('button', {
      name: /select join the discussion mode/i,
    });
    const select = within(button).getByRole('textbox');
    expect(select).toHaveValue('Accept joining the discussion after approval');

    userEvent.click(button);
    userEvent.click(screen.getByText(/everybody will join the discussion/i));

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        join_mode: 'forced',
      }),
    });
    expect(report).not.toHaveBeenCalled();
    await screen.findByText('Video updated.');

    // simulate video update
    rerender(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <LiveJoinMode />
        </InfoWidgetModalProvider>,
        { ...mockedVideo, join_mode: JoinMode.FORCED },
      ),
    );
    expect(within(button).getByRole('textbox')).toHaveValue(
      'Everybody will join the discussion',
    );
  });

  it('selects join mode denied, but backend returns an error', async () => {
    const mockedVideo = videoMockFactory({
      is_public: false,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, 500);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <LiveJoinMode />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const button = screen.getByRole('button', {
      name: /select join the discussion mode/i,
    });
    const select = within(button).getByRole('textbox');
    expect(select).toHaveValue('Accept joining the discussion after approval');

    userEvent.click(button);
    userEvent.click(screen.getByText(/not allowed/i));

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        join_mode: 'denied',
      }),
    });
    expect(report).toHaveBeenCalled();
    await screen.findByText('Video update has failed !');
  });
});

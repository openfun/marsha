import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';

import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import { useJwt } from 'data/stores/useJwt';
import { report } from 'utils/errors/report';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { DashboardVODWidgetGeneralTitle } from '.';

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

describe('<DashboardVODWidgetGeneralTitle />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  afterAll(() => {
    jest.runAllTimers();
    jest.useRealTimers();
  });

  it('renders the widget', () => {
    const mockedVideo = videoMockFactory({
      title: 'An example title',
      description: 'An example description',
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DashboardVODWidgetGeneralTitle />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('General');

    const textInput = screen.getByRole('textbox', {
      name: 'Enter title of your VOD here',
    });
    expect(textInput).toHaveValue('An example title');
    screen.getByPlaceholderText('Enter title of your VOD here');

    const textArea = screen.getByRole('textbox', {
      name: 'Description...',
    });
    expect(textArea).toHaveValue('An example description');
    screen.getByPlaceholderText('Description...');
  });

  it('types some text in an empty title input text', async () => {
    const mockedVideo = videoMockFactory({
      title: null,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      title: 'An example text',
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DashboardVODWidgetGeneralTitle />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const textInput = screen.getByRole('textbox', {
      name: 'Enter title of your VOD here',
    });
    screen.getByPlaceholderText('Enter title of your VOD here');
    expect(textInput).toHaveValue('');

    userEvent.type(textInput, 'An example text');
    expect(textInput).toHaveValue('An example text');

    act(() => {
      jest.runOnlyPendingTimers();
    });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'An example text',
      }),
    });
    expect(textInput).toHaveValue('An example text');
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Video updated.');
  });

  it('clears the title input text', async () => {
    const mockedVideo = videoMockFactory({
      title: 'An existing title',
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      title: ['This field may not be blank.'],
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DashboardVODWidgetGeneralTitle />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const textInput = screen.getByRole('textbox', {
      name: 'Enter title of your VOD here',
    });
    expect(textInput).toHaveValue('An existing title');

    userEvent.clear(textInput);
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(fetchMock.calls()).toHaveLength(0);
    await waitFor(() => expect(textInput).toHaveValue('An existing title'));
    expect(report).not.toHaveBeenCalled();
    screen.getByText("Title can't be blank !");
  });

  it('modifies the title input text, but the backend returns an error', async () => {
    const mockedVideo = videoMockFactory({
      title: 'An existing title',
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, 500);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DashboardVODWidgetGeneralTitle />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const textInput = screen.getByRole('textbox', {
      name: 'Enter title of your VOD here',
    });
    expect(textInput).toHaveValue('An existing title');

    userEvent.type(textInput, ' and more');
    act(() => {
      jest.runOnlyPendingTimers();
    });
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'An existing title and more',
      }),
    });
    expect(textInput).toHaveValue('An existing title');
    expect(report).toHaveBeenCalled();
    screen.getByText('Video update has failed !');
  });

  it('types some text in an empty text area', async () => {
    const mockedVideo = videoMockFactory({
      id: 'video_id',
      description: undefined,
    });

    fetchMock.patch('/api/videos/video_id/', {
      ...mockedVideo,
      description: 'A new description',
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DashboardVODWidgetGeneralTitle />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const textArea = screen.getByRole('textbox', {
      name: 'Description...',
    });
    screen.getByPlaceholderText('Description...');
    expect(textArea).toHaveValue('');

    userEvent.type(textArea, 'A new description');
    expect(textArea).toHaveValue('A new description');

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        description: 'A new description',
      }),
    });
    screen.getByText('Video updated.');
  });

  it('clears the text area', async () => {
    const mockedVideo = videoMockFactory({
      id: 'video_id',
      description: 'An existing description',
    });

    fetchMock.patch('/api/videos/video_id/', {
      ...mockedVideo,
      description: '',
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DashboardVODWidgetGeneralTitle />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const textArea = screen.getByRole('textbox', {
      name: 'Description...',
    });
    expect(textArea).toHaveValue('An existing description');

    userEvent.clear(textArea);
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        description: '',
      }),
    });
    expect(textArea).toHaveValue('');
    screen.getByText('Video updated.');
  });

  it('modifies the text area, but the API returns an error', async () => {
    const mockedVideo = videoMockFactory({
      id: 'video_id',
      description: 'An existing description',
    });

    fetchMock.patch('/api/videos/video_id/', 500);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <DashboardVODWidgetGeneralTitle />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const textArea = screen.getByRole('textbox', {
      name: 'Description...',
    });
    expect(textArea).toHaveValue('An existing description');

    userEvent.type(textArea, ' and more');
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/video_id/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        description: 'An existing description and more',
      }),
    });
    expect(textArea).toHaveValue('An existing description');
    screen.getByText('Video update has failed !');
  });
});

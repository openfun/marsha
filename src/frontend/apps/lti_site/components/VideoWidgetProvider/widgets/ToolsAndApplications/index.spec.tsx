import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useJwt, videoMockFactory, report } from 'lib-components';
import React from 'react';

import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { ToolsAndApplications } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('<ToolsAndApplications />', () => {
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
      has_chat: true,
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <ToolsAndApplications />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('Tools and applications');

    const chatToggleButton = screen.getByRole('checkbox', {
      name: 'Activate chat',
    });
    expect(chatToggleButton).toBeChecked();
    screen.getByText('Activate chat');
  });

  it('clicks on the toggle button for activate the chat', async () => {
    const mockedVideo = videoMockFactory({
      has_chat: false,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      has_chat: true,
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <ToolsAndApplications />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('Activate chat');
    const chatToggleButton = screen.getByRole('checkbox', {
      name: 'Activate chat',
    });

    await act(async () => userEvent.click(chatToggleButton));
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        has_chat: true,
      }),
    });
    expect(chatToggleButton).toBeChecked();
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Video updated.');
  });

  it('clicks on the toggle button for deactivate the chat', async () => {
    const mockedVideo = videoMockFactory({
      has_chat: true,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      has_chat: false,
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <ToolsAndApplications />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('Activate chat');
    const chatToggleButton = screen.getByRole('checkbox', {
      name: 'Activate chat',
    });

    await act(async () => userEvent.click(chatToggleButton));

    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        has_chat: false,
      }),
    });
    expect(chatToggleButton).not.toBeChecked();
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Video updated.');
  });

  it('clicks on the toggle button for activate chat, but backend returns an error', async () => {
    const mockedVideo = videoMockFactory({
      has_chat: false,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, 500);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <ToolsAndApplications />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('Activate chat');

    const chatToggleButton = screen.getByRole('checkbox', {
      name: 'Activate chat',
    });
    await act(async () => userEvent.click(chatToggleButton));

    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        has_chat: true,
      }),
    });
    expect(chatToggleButton).not.toBeChecked();
    expect(report).toHaveBeenCalled();
    screen.getByText('Video update has failed !');
  });

  it('renders the activation live toggle', async () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <ToolsAndApplications />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const recordingToggleButton = screen.getByRole('checkbox', {
      name: 'Activate live recording',
    });
    expect(recordingToggleButton).not.toBeChecked();
    screen.getByText('Activate live recording');
  });

  it('clicks on the toggle button for activate the live recording', async () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      allow_recording: true,
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <ToolsAndApplications />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('Activate live recording');
    const recordingToggleButton = screen.getByRole('checkbox', {
      name: 'Activate live recording',
    });

    userEvent.click(recordingToggleButton);
    await waitFor(() => {
      expect(fetchMock.calls()).toHaveLength(1);
    });
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        allow_recording: true,
      }),
    });
    expect(recordingToggleButton).toBeChecked();
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Video updated.');
  });

  it('clicks on the toggle button for activate the live recording', async () => {
    const mockedVideo = videoMockFactory({
      allow_recording: true,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      allow_recording: false,
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <ToolsAndApplications />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('Activate live recording');
    const recordingToggleButton = screen.getByRole('checkbox', {
      name: 'Activate live recording',
    });

    userEvent.click(recordingToggleButton);
    await waitFor(() => {
      expect(fetchMock.calls()).toHaveLength(1);
    });
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        allow_recording: false,
      }),
    });
    expect(recordingToggleButton).not.toBeChecked();
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Video updated.');
  });

  it('clicks on the toggle button for activate live recording, but backend returns an error', async () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, 500);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <ToolsAndApplications />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('Activate live recording');

    const recordingToggleButton = screen.getByRole('checkbox', {
      name: 'Activate live recording',
    });

    userEvent.click(recordingToggleButton);
    await waitFor(() => {
      expect(fetchMock.calls()).toHaveLength(1);
    });
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        allow_recording: true,
      }),
    });
    expect(recordingToggleButton).not.toBeChecked();
    expect(report).toHaveBeenCalled();
    screen.getByText('Video update has failed !');
  });
});

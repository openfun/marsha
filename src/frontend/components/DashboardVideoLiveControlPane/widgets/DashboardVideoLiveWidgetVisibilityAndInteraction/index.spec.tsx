import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';

import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import { report } from 'utils/errors/report';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import { DashboardVideoLiveWidgetVisibilityAndInteraction } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'json web token',
  },
}));

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

// Even if its depreciated, it's what is used under-the-hood in the clipboard.js librairy
document.execCommand = jest.fn();

describe('<DashboardVideoLiveWidgetVisibilityAndInteraction />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('renders the widget', () => {
    const mockedVideo = videoMockFactory({
      is_public: true,
    });

    render(
      <InfoWidgetModalProvider value={null}>
        <DashboardVideoLiveWidgetVisibilityAndInteraction video={mockedVideo} />
      </InfoWidgetModalProvider>,
    );

    screen.getByText('Visibility and interaction parameters');

    const visibilityToggleButton = screen.getByRole('checkbox', {
      name: 'Make the video publicly available',
    });
    expect(visibilityToggleButton).toBeChecked();
    screen.getByText('Make the video publicly available');

    screen.getByText('https://localhost/videos/'.concat(mockedVideo.id));
    screen.getByRole('button', {
      name: "A button to copy the video's publicly available url in clipboard",
    });
  });

  it('clicks on the toggle button to make the video publicly available, and copy the url in clipboard', async () => {
    const mockedVideo = videoMockFactory({
      is_public: false,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      is_public: true,
    });

    const { rerender } = render(
      <InfoWidgetModalProvider value={null}>
        <DashboardVideoLiveWidgetVisibilityAndInteraction video={mockedVideo} />
      </InfoWidgetModalProvider>,
    );

    const visibilityToggleButton = screen.getByRole('checkbox', {
      name: 'Make the video publicly available',
    });
    expect(visibilityToggleButton).not.toBeChecked();

    expect(
      screen.queryByRole('button', {
        name: "A button to copy the video's publicly available url in clipboard",
      }),
    ).toBe(null);
    expect(
      screen.queryByText('https://localhost/videos/'.concat(mockedVideo.id)),
    );

    await act(async () => userEvent.click(visibilityToggleButton));
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        is_public: true,
      }),
    });
    expect(visibilityToggleButton).toBeChecked();
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Video updated.');

    // simulate video update
    rerender(
      <InfoWidgetModalProvider value={null}>
        <DashboardVideoLiveWidgetVisibilityAndInteraction
          video={{ ...mockedVideo, is_public: true }}
        />
      </InfoWidgetModalProvider>,
    );

    const copyButtonReRendered = screen.getByRole('button', {
      name: "A button to copy the video's publicly available url in clipboard",
    });
    expect(copyButtonReRendered).not.toBeDisabled();
    screen.getByText('https://localhost/videos/'.concat(mockedVideo.id));
    expect(document.execCommand).toHaveBeenCalledTimes(0);
    act(() => userEvent.click(copyButtonReRendered));
    expect(document.execCommand).toHaveBeenCalledTimes(1);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    screen.getByText('Url copied in clipboard !');
  });

  it('clicks on the toggle button to make the video private', async () => {
    const mockedVideo = videoMockFactory({
      is_public: true,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      is_public: false,
    });

    const { rerender } = render(
      <InfoWidgetModalProvider value={null}>
        <DashboardVideoLiveWidgetVisibilityAndInteraction video={mockedVideo} />
      </InfoWidgetModalProvider>,
    );

    const visibilityToggleButton = screen.getByRole('checkbox', {
      name: 'Make the video publicly available',
    });
    expect(visibilityToggleButton).toBeChecked();
    screen.getByText('https://localhost/videos/'.concat(mockedVideo.id));
    const copyButton = screen.getByRole('button', {
      name: "A button to copy the video's publicly available url in clipboard",
    });
    expect(copyButton).not.toBeDisabled();

    await act(async () => userEvent.click(visibilityToggleButton));
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        is_public: false,
      }),
    });
    expect(visibilityToggleButton).not.toBeChecked();
    expect(report).not.toHaveBeenCalled();
    screen.getByText('Video updated.');

    // simulate video update
    rerender(
      <InfoWidgetModalProvider value={null}>
        <DashboardVideoLiveWidgetVisibilityAndInteraction
          video={{ ...mockedVideo, is_public: false }}
        />
      </InfoWidgetModalProvider>,
    );

    expect(
      screen.queryByRole('button', {
        name: "A button to copy the video's publicly available url in clipboard",
      }),
    );
    expect(
      screen.queryByText('https://localhost/videos/'.concat(mockedVideo.id)),
    );
  });

  it('clicks on the toggle button to make the video publicly available, but backend returns an error', async () => {
    const mockedVideo = videoMockFactory({
      is_public: false,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, 500);

    render(
      <InfoWidgetModalProvider value={null}>
        <DashboardVideoLiveWidgetVisibilityAndInteraction video={mockedVideo} />
      </InfoWidgetModalProvider>,
    );

    const visibilityToggleButton = screen.getByRole('checkbox', {
      name: 'Make the video publicly available',
    });
    expect(visibilityToggleButton).not.toBeChecked();

    await act(async () => userEvent.click(visibilityToggleButton));
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        is_public: true,
      }),
    });
    expect(visibilityToggleButton).not.toBeChecked();
    expect(report).toHaveBeenCalled();
    screen.getByText('Video update has failed !');
  });
});

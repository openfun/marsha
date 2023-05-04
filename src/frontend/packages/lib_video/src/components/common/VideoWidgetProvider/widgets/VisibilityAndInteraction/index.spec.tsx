import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  InfoWidgetModalProvider,
  useJwt,
  videoMockFactory,
  report,
} from 'lib-components';
import { render } from 'lib-tests';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { VisibilityAndInteraction } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

// Even if its depreciated, it's what is used under-the-hood in the clipboard.js librairy
document.execCommand = jest.fn();

describe('<VisibilityAndInteraction />', () => {
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
      is_public: true,
    });

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <VisibilityAndInteraction />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    screen.getByText('Visibility and interaction parameters');

    const visibilityToggleButton = screen.getByRole('checkbox', {
      name: 'Make the video publicly available',
    });
    expect(visibilityToggleButton).toBeChecked();
    screen.getByText('Make the video publicly available');

    screen.getByText('https://localhost/videos/'.concat(mockedVideo.id));
    screen.getByRole('button', {
      name: 'Public link:',
    });
    screen.getByRole('button', {
      name: 'Iframe integration:',
    });
  });

  it('clicks on the toggle button to make the video publicly available, and copy the public url in clipboard', async () => {
    const mockedVideo = videoMockFactory({
      is_public: false,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      ...mockedVideo,
      is_public: true,
    });

    const { rerender } = render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <VisibilityAndInteraction />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const visibilityToggleButton = screen.getByRole('checkbox', {
      name: 'Make the video publicly available',
    });
    expect(visibilityToggleButton).not.toBeChecked();

    expect(
      screen.queryByRole('button', {
        name: 'Public link:',
      }),
    ).toBe(null);
    expect(
      screen.queryByText('https://localhost/videos/'.concat(mockedVideo.id)),
    ).not.toBeInTheDocument();

    userEvent.click(visibilityToggleButton);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
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
    await screen.findByText('Video updated.');

    // simulate video update
    rerender(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <VisibilityAndInteraction />
        </InfoWidgetModalProvider>,
        { ...mockedVideo, is_public: true },
      ),
    );

    const copyButtonReRendered = screen.getByRole('button', {
      name: 'Public link:',
    });
    expect(copyButtonReRendered).not.toBeDisabled();
    screen.getByText('https://localhost/videos/'.concat(mockedVideo.id));
    expect(document.execCommand).toHaveBeenCalledTimes(0);

    userEvent.click(copyButtonReRendered);

    await waitFor(() => expect(document.execCommand).toHaveBeenCalledTimes(1));
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    await screen.findByText('Url copied in clipboard !');
  });

  it('checks the iframe code for a VOD and copy the code in clipboard', async () => {
    const mockedVideo = videoMockFactory({
      is_public: true,
    });

    // simulate video update
    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <VisibilityAndInteraction />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const copyButtonReRendered = screen.getByRole('button', {
      name: 'Iframe integration:',
    });
    expect(copyButtonReRendered).not.toBeDisabled();

    const iframeCode = `<iframe src="https://localhost/videos/${mockedVideo.id}" allowfullscreen="true" allow="encrypted-media *; autoplay *; fullscreen *" />`;
    screen.getByText(iframeCode);

    expect(document.execCommand).toHaveBeenCalledTimes(0);

    userEvent.click(copyButtonReRendered);

    await waitFor(() => expect(document.execCommand).toHaveBeenCalledTimes(1));
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    await screen.findByText('Code copied in clipboard !');
  });

  it('checks the iframe code for a webinar and copy the code in clipboard', async () => {
    const mockedVideo = videoMockFactory({
      is_public: true,
      is_live: true,
    });

    // simulate video update
    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <VisibilityAndInteraction />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const copyButtonReRendered = screen.getByRole('button', {
      name: 'Iframe integration:',
    });
    expect(copyButtonReRendered).not.toBeDisabled();

    const iframeCode =
      `<iframe src="https://localhost/videos/${mockedVideo.id}" allowfullscreen="true" ` +
      `allow="microphone *; camera *; midi *; display-capture *; encrypted-media *; autoplay *; fullscreen *" />`;
    screen.getByText(iframeCode);

    expect(document.execCommand).toHaveBeenCalledTimes(0);

    userEvent.click(copyButtonReRendered);

    await waitFor(() => expect(document.execCommand).toHaveBeenCalledTimes(1));
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    await screen.findByText('Code copied in clipboard !');
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
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <VisibilityAndInteraction />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const visibilityToggleButton = screen.getByRole('checkbox', {
      name: 'Make the video publicly available',
    });
    expect(visibilityToggleButton).toBeChecked();
    expect(
      screen.getByText('https://localhost/videos/'.concat(mockedVideo.id)),
    ).toBeInTheDocument();
    const copyButton = screen.getByRole('button', {
      name: 'Public link:',
    });
    expect(copyButton).not.toBeDisabled();

    userEvent.click(visibilityToggleButton);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
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
    await screen.findByText('Video updated.');

    // simulate video update
    rerender(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <VisibilityAndInteraction />
        </InfoWidgetModalProvider>,
        { ...mockedVideo, is_public: false },
      ),
    );

    await waitFor(() =>
      expect(
        screen.queryByText('https://localhost/videos/'.concat(mockedVideo.id)),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole('button', {
        name: "A button to copy the video's publicly available url in clipboard",
      }),
    ).not.toBeInTheDocument();
  });

  it('clicks on the toggle button to make the video publicly available, but backend returns an error', async () => {
    const mockedVideo = videoMockFactory({
      is_public: false,
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, 500);

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <VisibilityAndInteraction />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    const visibilityToggleButton = screen.getByRole('checkbox', {
      name: 'Make the video publicly available',
    });
    expect(visibilityToggleButton).not.toBeChecked();

    userEvent.click(visibilityToggleButton);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
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
    await screen.findByText('Video update has failed !');
  });
});

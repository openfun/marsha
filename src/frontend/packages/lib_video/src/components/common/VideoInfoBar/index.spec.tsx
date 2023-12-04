import {
  act,
  getDefaultNormalizer,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { report, useJwt } from 'lib-components';
import { participantMockFactory, videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';

import { useParticipantsStore } from '@lib-video/hooks/useParticipantsStore';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { VideoInfoBar } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

const mockParticipant = participantMockFactory();

describe('<VideoInfoBar />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    fetchMock.reset();
    jest.resetAllMocks();
  });

  it('renders placeholder title, startDate and viewers connected', () => {
    useParticipantsStore.setState({
      participants: [
        {
          id: 'id-anonymous',
          userJid: 'userJid-anonymous',
          isInstructor: false,
          isOnStage: false,
          name: 'my anonymous name',
        },
        {
          id: 'id-anonymous-2',
          userJid: 'userJid-anonymous',
          isInstructor: false,
          isOnStage: true,
          name: 'my anonymous name 2',
        },
        {
          id: 'id-named',
          userJid: 'userJid-anonymous',
          isInstructor: false,
          isOnStage: false,
          name: 'my name',
        },
        {
          id: 'id-instructor',
          userJid: 'userJid-anonymous',
          isInstructor: true,
          isOnStage: true,
          name: 'my instructor',
        },
      ],
    });

    const mockedVideo = videoMockFactory({
      allow_recording: false,
      title: 'title',
    });

    render(
      wrapInVideo(
        <VideoInfoBar isTeacher startDate="2022-09-26T07:00:00Z" />,
        mockedVideo,
      ),
    );

    expect(screen.getByDisplayValue('title')).toBeInTheDocument();
    expect(
      screen.getByText('9/26/2022  ·  7:00:00 AM', {
        normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('3 viewers connected')).toBeInTheDocument();
  });

  it('renders startDate Intl NL - Netherlands', () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
      title: 'title',
    });

    render(
      wrapInVideo(
        <VideoInfoBar isTeacher startDate="2022-09-26T07:00:00Z" />,
        mockedVideo,
      ),
      {
        intlOptions: { locale: 'nl' },
      },
    );

    expect(
      screen.getByText('26-9-2022  ·  07:00:00', {
        normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
      }),
    ).toBeInTheDocument();
  });

  it('renders startDate Intl fr - France', () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
      title: 'title',
    });

    render(
      wrapInVideo(
        <VideoInfoBar isTeacher startDate="2022-09-26T07:00:00Z" />,
        mockedVideo,
      ),
      {
        intlOptions: { locale: 'fr' },
      },
    );

    expect(
      screen.getByText('26/09/2022  ·  07:00:00', {
        normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
      }),
    ).toBeInTheDocument();
  });

  it('renders with invalid startDate', () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
      title: 'title',
    });

    render(
      wrapInVideo(
        <VideoInfoBar isTeacher startDate="some date" />,
        mockedVideo,
      ),
    );

    expect(screen.getByDisplayValue('title')).toBeInTheDocument();
    expect(screen.queryByText('some date')).not.toBeInTheDocument();
    expect(screen.queryByText('Invalid DateTime')).not.toBeInTheDocument();
  });

  it('allows you to edit the title', async () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
      title: 'title',
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, {
      title: ['new title'],
    });

    render(
      wrapInVideo(
        <VideoInfoBar isTeacher startDate="some date" />,
        mockedVideo,
      ),
    );

    const titleInput = screen.getByRole('textbox', {
      name: 'Enter title of your video here',
    });
    act(() => {
      titleInput.focus();
    });
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'new title');
    act(() => {
      titleInput.blur();
    });
    expect(titleInput).toHaveValue('new title');
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'new title',
      }),
    });
    expect(titleInput).toHaveValue('new title');
    screen.getByText('Video updated.');
  });

  it('should stop user from entering an empty title', async () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
      title: 'title',
    });

    render(
      wrapInVideo(
        <VideoInfoBar isTeacher startDate="some date" />,
        mockedVideo,
      ),
    );

    const titleInput = await screen.findByRole('textbox', {
      name: 'Enter title of your video here',
    });
    act(() => {
      titleInput.focus();
    });
    await userEvent.clear(titleInput);
    act(() => {
      titleInput.blur();
    });

    await waitFor(() => expect(titleInput).toHaveValue('title'));
    expect(fetchMock.calls()).toHaveLength(0);
    expect(screen.getByText("Title can't be blank !")).toBeInTheDocument();
  });

  it('modifies the input text, but the backend returns an error', async () => {
    const mockedVideo = videoMockFactory({
      title: 'An existing title',
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, 500);

    render(
      wrapInVideo(
        <VideoInfoBar isTeacher startDate="some date" />,
        mockedVideo,
      ),
    );

    const textInput = screen.getByRole('textbox', {
      name: 'Enter title of your video here',
    });
    expect(textInput).toHaveValue('An existing title');

    await userEvent.type(textInput, ' and more');
    act(() => {
      textInput.blur();
    });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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

  it('displays the correct number of students in the discussion', () => {
    const mockedVideo = videoMockFactory({});

    useParticipantsStore.setState({
      participants: [
        {
          ...mockParticipant,
          userJid: 'userJid-anonymous',
          isInstructor: true,
          isOnStage: false,
        },
        {
          ...mockParticipant,
          userJid: 'userJid-anonymous',
          isInstructor: false,
          isOnStage: true,
        },
        {
          ...mockParticipant,
          userJid: 'userJid-anonymous',
          isInstructor: false,
          isOnStage: false,
        },
      ],
    });

    render(
      wrapInVideo(
        <VideoInfoBar isTeacher startDate="some date" />,
        mockedVideo,
      ),
    );

    expect(screen.getByText('2 viewers connected')).toBeInTheDocument();
  });

  it('checks input placeholder when live', () => {
    const mockedVideo = videoMockFactory({
      is_live: true,
    });

    render(
      wrapInVideo(
        <VideoInfoBar isTeacher startDate="some date" />,
        mockedVideo,
      ),
    );

    expect(
      screen.getByRole('textbox', {
        name: 'Enter title of your live here',
      }),
    ).toBeInTheDocument();
  });
});

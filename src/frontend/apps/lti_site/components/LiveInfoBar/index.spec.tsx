import { getDefaultNormalizer, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';
import { useParticipantsStore } from 'data/stores/useParticipantsStore/index';
import render from 'utils/tests/render';
import { videoMockFactory, report, useJwt } from 'lib-components';

import { LiveInfoBar } from '.';
import { wrapInVideo } from '../../utils/tests/wrapInVideo';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('<LiveInfoBar />', () => {
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
          isInstructor: false,
          isOnStage: false,
          name: 'my anonymous name',
        },
        {
          id: 'id-anonymous-2',
          isInstructor: false,
          isOnStage: true,
          name: 'my anonymous name 2',
        },
        {
          id: 'id-named',
          isInstructor: false,
          isOnStage: false,
          name: 'my name',
        },
        {
          id: 'id-instructor',
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
        <LiveInfoBar isTeacher startDate={'2022-09-26T07:00:00Z'} />,
        mockedVideo,
      ),
    );

    screen.getByDisplayValue('title');
    screen.getByText('9/26/2022  ·  7:00:00 AM', {
      normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
    });
    screen.getByText('4 viewers connected.');
  });

  it('renders startDate Intl NL - Netherlands', () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
      title: 'title',
    });

    render(
      wrapInVideo(
        <LiveInfoBar isTeacher startDate={'2022-09-26T07:00:00Z'} />,
        mockedVideo,
      ),
      {
        intlOptions: { locale: 'nl' },
      },
    );

    screen.getByText('26-9-2022  ·  07:00:00', {
      normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
    });
  });

  it('renders startDate Intl fr - France', () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
      title: 'title',
    });

    render(
      wrapInVideo(
        <LiveInfoBar isTeacher startDate={'2022-09-26T07:00:00Z'} />,
        mockedVideo,
      ),
      {
        intlOptions: { locale: 'fr' },
      },
    );

    screen.getByText('26/09/2022  ·  07:00:00', {
      normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
    });
  });

  it('renders with invalid startDate', () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
      title: 'title',
    });

    render(
      wrapInVideo(
        <LiveInfoBar isTeacher startDate={'some date'} />,
        mockedVideo,
      ),
    );

    screen.getByDisplayValue('title');
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
        <LiveInfoBar isTeacher startDate={'some date'} />,
        mockedVideo,
      ),
    );

    const titleInput = screen.getByRole('textbox', {
      name: 'Enter title of your live here',
    });
    titleInput.focus();
    userEvent.clear(titleInput);
    userEvent.type(titleInput, 'new title');
    titleInput.blur();
    expect(titleInput).toHaveValue('new title');
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(`/api/videos/${mockedVideo.id}/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer json web token',
        'Content-Type': 'application/json',
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
        <LiveInfoBar isTeacher startDate={'some date'} />,
        mockedVideo,
      ),
    );

    const titleInput = screen.getByRole('textbox', {
      name: 'Enter title of your live here',
    });
    titleInput.focus();
    userEvent.clear(titleInput);
    titleInput.blur();

    expect(titleInput).toHaveValue('title');
    expect(fetchMock.calls()).toHaveLength(0);
    screen.getByText("Title can't be blank !");
  });

  it('modifies the input text, but the backend returns an error', async () => {
    const mockedVideo = videoMockFactory({
      title: 'An existing title',
    });

    fetchMock.patch(`/api/videos/${mockedVideo.id}/`, 500);

    render(
      wrapInVideo(
        <LiveInfoBar isTeacher startDate={'some date'} />,
        mockedVideo,
      ),
    );

    const textInput = screen.getByRole('textbox', {
      name: 'Enter title of your live here',
    });
    expect(textInput).toHaveValue('An existing title');

    userEvent.type(textInput, ' and more');
    textInput.blur();
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
});

import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  UploadManagerContext,
  UploadManagerStatus,
  modelName,
  playlistMockFactory,
  videoMockFactory,
} from 'lib-components';
import { Deferred, render } from 'lib-tests';
import React from 'react';

import { VideoCreateForm } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({}),
}));

describe('<VideoCreateForm />', () => {
  jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

  beforeEach(() => {
    fetchMock.restore();
  });

  it('lets the user create a video with the title and playlist ID through 3 steps', async () => {
    const postStep1Deferred = new Deferred();
    fetchMock.post('/api/videos/', postStep1Deferred.promise);

    const playlist = playlistMockFactory();
    const video = videoMockFactory({ title: 'new video title', playlist });

    const { rerender } = render(
      <UploadManagerContext.Provider
        value={{ setUploadState: jest.fn(), uploadManagerState: {} }}
      >
        <VideoCreateForm />
      </UploadManagerContext.Provider>,
    );

    {
      // Step 1
      const titleField = screen.getByRole('textbox', { name: 'Title' });
      const playlistField = screen.getByRole('textbox', {
        name: 'Playlist ID',
      });
      const btn = screen.getByRole('button', { name: 'Create the video' });
      screen.getByRole('list', { name: 'Video creation progress' });
      {
        const step1 = screen.getByRole('listitem', {
          name: 'Current: Video details (1/3)',
        });
        expect(step1).toHaveAttribute('aria-current', 'step');
        const step2 = screen.getByRole('listitem', {
          name: 'File selection (2/3)',
        });
        expect(step2).toHaveAttribute('aria-current', 'false');
        const step3 = screen.getByRole('listitem', {
          name: 'Processing (3/3)',
        });
        expect(step3).toHaveAttribute('aria-current', 'false');
      }
      // The form does not send when the title field is not set
      await userEvent.click(btn);
      screen.getByText('The title is required to create a new video.');
      // The form does not send when the playlist is not passed and the playlist field is not set
      await userEvent.type(titleField, 'new video title');
      await userEvent.click(btn);
      screen.getByText('The playlist ID is required to create a new video.');
      expect(
        screen.queryByText('The title is required to create a new video.'),
      ).toBeNull();

      await userEvent.type(playlistField, playlist.id);
      await userEvent.click(btn);
      expect(
        screen.queryByText('The title is required to create a new video.'),
      ).toBeNull();
      expect(
        screen.queryByText(
          'The playlist ID is required to create a new video.',
        ),
      ).toBeNull();

      await waitFor(() => {
        expect(
          fetchMock.called('/api/videos/', {
            body: { title: 'new video title', playlist: playlist.id },
            method: 'POST',
          }),
        ).toEqual(true);
      });
      screen.getByRole('status', { name: 'Creating video...' });

      await act(async () => postStep1Deferred.resolve(video));
    }

    {
      // Step 2 is the file upload field
      screen.getByRole('button', {
        name: 'Select a file to upload',
      });
      {
        const step1 = screen.getByRole('listitem', {
          name: 'Completed: Video details (1/3)',
        });
        expect(step1).toHaveAttribute('aria-current', 'false');
        const step2 = screen.getByRole('listitem', {
          name: 'Current: File selection (2/3)',
        });
        expect(step2).toHaveAttribute('aria-current', 'step');
        const step3 = screen.getByRole('listitem', {
          name: 'Processing (3/3)',
        });
        expect(step3).toHaveAttribute('aria-current', 'false');
      }

      // Rerender with a different value in upload manager to simulate an ongoing upload
      rerender(
        <UploadManagerContext.Provider
          value={{
            setUploadState: jest.fn(),
            uploadManagerState: {
              [video.id]: {
                file: new File(['(⌐□_□)'], 'course.mp4', {
                  type: 'video/mp4',
                }),
                objectId: video.id,
                objectType: modelName.VIDEOS,
                progress: 10,
                status: UploadManagerStatus.UPLOADING,
              },
            },
          }}
        >
          <VideoCreateForm />
        </UploadManagerContext.Provider>,
      );

      // Step 3 is just the ongoing upload with some help text for users
      screen.getByRole('button', { name: 'Create another video' });
      screen.getByText('Video creation in progress');
      screen.getByText(
        'You can use the file uploads manager to monitor ongoing uploads, or go to the video page to start adding subtitles.',
      );
      {
        const step1 = screen.getByRole('listitem', {
          name: 'Completed: Video details (1/3)',
        });
        expect(step1).toHaveAttribute('aria-current', 'false');
        const step2 = screen.getByRole('listitem', {
          name: 'Completed: File selection (2/3)',
        });
        expect(step2).toHaveAttribute('aria-current', 'false');
        const step3 = screen.getByRole('listitem', {
          name: 'Current: Processing (3/3)',
        });
        expect(step3).toHaveAttribute('aria-current', 'step');
      }
    }
  });

  it('does not ask for the playlist ID it it is provided to the form as a prop', async () => {
    const postStep1Deferred = new Deferred();
    fetchMock.post('/api/videos/', postStep1Deferred.promise);

    const playlist = playlistMockFactory();
    const video = videoMockFactory({ title: 'new video title', playlist });

    render(<VideoCreateForm playlist={playlist.id} />);

    const titleField = screen.getByRole('textbox', { name: 'Title' });
    expect(
      screen.queryByRole('textbox', {
        name: 'Playlist ID',
      }),
    ).toBeNull();
    const btn = screen.getByRole('button', { name: 'Create the video' });
    screen.getByRole('list', { name: 'Video creation progress' });

    // The form does not send when the title field is not set
    await userEvent.click(btn);
    screen.getByText('The title is required to create a new video.');

    // As the playlist ID is available to the component, it does not ask it from the user
    await userEvent.type(titleField, 'new video title');
    await userEvent.click(btn);
    expect(
      screen.queryByText('The title is required to create a new video.'),
    ).toBeNull();

    await waitFor(() => {
      expect(
        fetchMock.called('/api/videos/', {
          body: { title: 'new video title', playlist: playlist.id },
          method: 'POST',
        }),
      ).toEqual(true);
    });
    screen.getByRole('status', { name: 'Creating video...' });

    await act(async () => postStep1Deferred.resolve(video));

    // We move on to step 2, which is covered by the previous test
    screen.getByRole('button', {
      name: 'Select a file to upload',
    });
  });

  it('shows errors on the title field as they are returned by the API', async () => {
    const postStep1Deferred = new Deferred();
    fetchMock.post('/api/videos/', postStep1Deferred.promise);

    const playlist = playlistMockFactory();

    render(<VideoCreateForm />);

    const titleField = screen.getByRole('textbox', { name: 'Title' });
    const playlistField = screen.getByRole('textbox', {
      name: 'Playlist ID',
    });
    const btn = screen.getByRole('button', { name: 'Create the video' });
    screen.getByRole('list', { name: 'Video creation progress' });

    await userEvent.type(titleField, 'new video title');
    await userEvent.type(playlistField, playlist.id);
    await userEvent.click(btn);

    await waitFor(() => {
      expect(
        fetchMock.called('/api/videos/', {
          body: { title: 'new video title', playlist: playlist.id },
          method: 'POST',
        }),
      ).toEqual(true);
    });
    screen.getByRole('status', { name: 'Creating video...' });

    await act(async () =>
      postStep1Deferred.resolve({
        status: 400,
        body: {
          errors: [
            {
              title: ['Some title related error.', 'Another title error.'],
            },
          ],
        },
      }),
    );

    screen.getByText('Some title related error.');
    screen.getByText('Another title error.');
  });

  it('shows errors on the playlist ID field as they are returned by the API', async () => {
    const postStep1Deferred = new Deferred();
    fetchMock.post('/api/videos/', postStep1Deferred.promise);

    const playlist = playlistMockFactory();

    render(<VideoCreateForm />);

    const titleField = screen.getByRole('textbox', { name: 'Title' });
    const playlistField = screen.getByRole('textbox', {
      name: 'Playlist ID',
    });
    const btn = screen.getByRole('button', { name: 'Create the video' });
    screen.getByRole('list', { name: 'Video creation progress' });

    await userEvent.type(titleField, 'new video title');
    await userEvent.type(playlistField, playlist.id);
    await userEvent.click(btn);

    await waitFor(() => {
      expect(
        fetchMock.called('/api/videos/', {
          body: { title: 'new video title', playlist: playlist.id },
          method: 'POST',
        }),
      ).toEqual(true);
    });
    screen.getByRole('status', { name: 'Creating video...' });

    await act(async () =>
      postStep1Deferred.resolve({
        status: 400,
        body: {
          errors: [
            {
              playlist: [
                'Some playlist related error.',
                'Another playlist error.',
              ],
            },
          ],
        },
      }),
    );

    screen.getByText('Some playlist related error.');
    screen.getByText('Another playlist error.');
  });
});

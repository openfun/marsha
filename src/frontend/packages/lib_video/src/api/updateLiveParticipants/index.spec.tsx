import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { participantMockFactory, videoMockFactory } from 'lib-components/tests';

import {
  addParticipantAskingToJoin,
  moveParticipantToDiscussion,
  removeParticipantAskingToJoin,
  removeParticipantFromDiscussion,
} from '.';

describe('updateLiveParticipants', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => fetchMock.restore());

  describe('addParticipantAskingToJoin', () => {
    it('sends a POST request to add a participant asking to join', async () => {
      const video = videoMockFactory();
      const participant = participantMockFactory();
      fetchMock.mock(
        `/api/videos/${video.id}/participants-asking-to-join/`,
        JSON.stringify({
          ...video,
          participants_asking_to_join: [participant],
        }),
        { method: 'POST' },
      );
      const updatedVideo = await addParticipantAskingToJoin(video, participant);

      expect(updatedVideo).toEqual({
        ...video,
        participants_asking_to_join: [participant],
        participants_in_discussion: [],
      });
      expect(fetchMock.lastCall()![1]!.headers).toEqual({
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      });
    });

    it('throws when it fails to add a participant asking to join (request failure)', async () => {
      const video = videoMockFactory();
      const participant = participantMockFactory();
      fetchMock.mock(
        `/api/videos/${video.id}/participants-asking-to-join/`,
        Promise.reject(new Error('Failed to perform the request')),
        { method: 'POST' },
      );

      await expect(
        addParticipantAskingToJoin(video, participant),
      ).rejects.toThrow('Failed to perform the request');
    });

    it('throws when it fails to add a participant asking to join (API error)', async () => {
      const video = videoMockFactory();
      const participant = participantMockFactory();
      fetchMock.mock(
        `/api/videos/${video.id}/participants-asking-to-join/`,
        400,
        {
          method: 'POST',
        },
      );

      await expect(
        addParticipantAskingToJoin(video, participant),
      ).rejects.toThrow(
        `Failed to add a participant asking to join the live video ${video.id}.`,
      );
    });
  });

  describe('moveParticipantToDiscussion', () => {
    it('sends a POST request to accept a participant asking to join', async () => {
      const video = videoMockFactory();
      const participant = participantMockFactory();
      fetchMock.mock(
        `/api/videos/${video.id}/participants-in-discussion/`,
        JSON.stringify({
          ...video,
          participants_asking_to_join: [participant],
        }),
        { method: 'POST' },
      );
      const updatedVideo = await moveParticipantToDiscussion(
        video,
        participant,
      );

      expect(updatedVideo).toEqual({
        ...video,
        participants_asking_to_join: [participant],
        participants_in_discussion: [],
      });
      expect(fetchMock.lastCall()![1]!.headers).toEqual({
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      });
    });

    it('throws when it fails to accept a participant asking to join (request failure)', async () => {
      const video = videoMockFactory();
      const participant = participantMockFactory();
      fetchMock.mock(
        `/api/videos/${video.id}/participants-in-discussion/`,
        Promise.reject(new Error('Failed to perform the request')),
        { method: 'POST' },
      );

      await expect(
        moveParticipantToDiscussion(video, participant),
      ).rejects.toThrow('Failed to perform the request');
    });

    it('throws when it fails to accept a participant asking to join (API error)', async () => {
      const video = videoMockFactory();
      const participant = participantMockFactory();
      fetchMock.mock(
        `/api/videos/${video.id}/participants-in-discussion/`,
        400,
        {
          method: 'POST',
        },
      );

      await expect(
        moveParticipantToDiscussion(video, participant),
      ).rejects.toThrow(
        `Failed to accept a participant asking to join the live video ${video.id}.`,
      );
    });
  });

  describe('removeParticipantAskingToJoin', () => {
    it('sends a POST request to remove a participant asking to join', async () => {
      const video = videoMockFactory();
      const participant = participantMockFactory();
      fetchMock.mock(
        `/api/videos/${video.id}/participants-asking-to-join/`,
        JSON.stringify({
          ...video,
          participants_asking_to_join: [participant],
        }),
        { method: 'DELETE' },
      );
      const updatedVideo = await removeParticipantAskingToJoin(
        video,
        participant,
      );

      expect(updatedVideo).toEqual({
        ...video,
        participants_asking_to_join: [participant],
        participants_in_discussion: [],
      });
      expect(fetchMock.lastCall()![1]!.headers).toEqual({
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      });
    });

    it('throws when it fails to remove a participant asking to join (request failure)', async () => {
      const video = videoMockFactory();
      const participant = participantMockFactory();
      fetchMock.mock(
        `/api/videos/${video.id}/participants-asking-to-join/`,
        Promise.reject(new Error('Failed to perform the request')),
        { method: 'DELETE' },
      );

      await expect(
        removeParticipantAskingToJoin(video, participant),
      ).rejects.toThrow('Failed to perform the request');
    });

    it('throws when it fails to remove a participant asking to join (API error)', async () => {
      const video = videoMockFactory();
      const participant = participantMockFactory();
      fetchMock.mock(
        `/api/videos/${video.id}/participants-asking-to-join/`,
        400,
        {
          method: 'DELETE',
        },
      );

      await expect(
        removeParticipantAskingToJoin(video, participant),
      ).rejects.toThrow(
        `Failed to remove a participant asking to join the live video ${video.id}.`,
      );
    });
  });

  describe('removeParticipantFromDiscussion', () => {
    it('sends a POST request to remove a participant from the discussion', async () => {
      const video = videoMockFactory();
      const participant = participantMockFactory();
      fetchMock.mock(
        `/api/videos/${video.id}/participants-in-discussion/`,
        JSON.stringify({
          ...video,
          participants_asking_to_join: [participant],
        }),
        { method: 'DELETE' },
      );
      const updatedVideo = await removeParticipantFromDiscussion(
        video,
        participant,
      );

      expect(updatedVideo).toEqual({
        ...video,
        participants_asking_to_join: [participant],
        participants_in_discussion: [],
      });
      expect(fetchMock.lastCall()![1]!.headers).toEqual({
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      });
    });

    it('throws when it fails to remove a participant from the discussion (request failure)', async () => {
      const video = videoMockFactory();
      const participant = participantMockFactory();
      fetchMock.mock(
        `/api/videos/${video.id}/participants-in-discussion/`,
        Promise.reject(new Error('Failed to perform the request')),
        { method: 'DELETE' },
      );

      await expect(
        removeParticipantFromDiscussion(video, participant),
      ).rejects.toThrow('Failed to perform the request');
    });

    it('throws when it fails to remove a participant from the discussion (API error)', async () => {
      const video = videoMockFactory();
      const participant = participantMockFactory();
      fetchMock.mock(
        `/api/videos/${video.id}/participants-in-discussion/`,
        400,
        {
          method: 'DELETE',
        },
      );

      await expect(
        removeParticipantFromDiscussion(video, participant),
      ).rejects.toThrow(
        `Failed to remove a participant from the discussion of the live video ${video.id}.`,
      );
    });
  });
});

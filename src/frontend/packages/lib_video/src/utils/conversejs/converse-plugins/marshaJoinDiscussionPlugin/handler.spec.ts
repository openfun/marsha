import fetchMock from 'fetch-mock';
import {
  useJwt,
  participantMockFactory,
  videoMockFactory,
  EventType,
  MessageType,
  useVideo,
  JitsiMeetExternalAPI,
} from 'lib-components';

import { useParticipantWorkflow } from '@lib-video/hooks/useParticipantWorkflow';

import marshaJoinDiscussionPluginHandler from './handler';

const mockStanza = (
  type: string,
  event: string,
  from: string,
  to: string,
  participant?: { id: string; name: string },
  jitsi?: {
    external_api_url?: string;
    domain?: string;
    config_overwrite: JitsiMeetExternalAPI.ConfigOverwriteOptions;
    interface_config_overwrite: JitsiMeetExternalAPI.InterfaceConfigOverwrtieOptions;
  },
) => ({
  getAttribute: (name: string) => {
    const attributes: { [index: string]: any } = {
      type,
      event,
      from,
      to,
      participant: JSON.stringify(participant),
      jitsi: JSON.stringify(jitsi),
    };
    return attributes[name];
  },
});

const username = 'username';
const fromParticipant = participantMockFactory();
const toParticipant = participantMockFactory();
const targetParticipant = participantMockFactory();

describe('marshaJoinDiscussionPluginHandler', () => {
  afterEach(() => fetchMock.restore());

  it('executes addParticipantAskingToJoin', async () => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: true,
          },
        } as any),
    });
    const video = videoMockFactory();
    const stanza = mockStanza(
      MessageType.GROUPCHAT,
      EventType.PARTICIPANT_ASK_TO_JOIN,
      fromParticipant.id,
      toParticipant.id,
    );

    fetchMock.mock(
      `/api/videos/${video.id}/participants-asking-to-join/`,
      JSON.stringify({}),
      { method: 'POST' },
    );

    await marshaJoinDiscussionPluginHandler(stanza, username, video);

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/participants-asking-to-join/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        id: fromParticipant.id,
        name: username,
      }),
    });
  });

  it('executes moveParticipantToDiscussion', async () => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: true,
          },
        } as any),
    });
    const video = videoMockFactory({
      participants_asking_to_join: [targetParticipant],
    });
    const stanza = mockStanza(
      MessageType.GROUPCHAT,
      EventType.ACCEPTED,
      fromParticipant.id,
      toParticipant.id,
      targetParticipant,
    );

    fetchMock.mock(
      `/api/videos/${video.id}/participants-in-discussion/`,
      JSON.stringify({}),
      { method: 'POST' },
    );

    await marshaJoinDiscussionPluginHandler(stanza, username, video);

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/participants-in-discussion/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(targetParticipant),
    });
  });

  it('updates video with jitsi info and accepts a user', async () => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: false,
          },
        } as any),
    });
    const video = videoMockFactory();
    const jitsi = {
      domain: 'meet.jit.si',
      external_api_url: 'https://meet.jit.si/external_api.js',
      config_overwrite: {},
      interface_config_overwrite: {},
    };
    const stanza = mockStanza(
      MessageType.EVENT,
      EventType.ACCEPT,
      fromParticipant.id,
      toParticipant.id,
      undefined,
      jitsi,
    );

    expect(useParticipantWorkflow.getState().accepted).toBe(false);

    await marshaJoinDiscussionPluginHandler(stanza, username, video);

    expect(useVideo.getState().videos[video.id]).toEqual({
      ...video,
      live_info: { jitsi },
    });
    expect(useParticipantWorkflow.getState().accepted).toBe(true);
  });

  it('rejects a user asking to join', async () => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: false,
          },
        } as any),
    });
    const video = videoMockFactory();
    const stanza = mockStanza(
      MessageType.EVENT,
      EventType.REJECT,
      fromParticipant.id,
      toParticipant.id,
    );
    useParticipantWorkflow.getState().setAccepted();
    expect(useParticipantWorkflow.getState().accepted).toBe(true);

    await marshaJoinDiscussionPluginHandler(stanza, username, video);

    expect(useParticipantWorkflow.getState().accepted).toBe(false);
  });

  it('executes removeParticipantAskingToJoin', async () => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: true,
          },
        } as any),
    });
    const video = videoMockFactory({
      participants_asking_to_join: [targetParticipant],
    });
    const stanza = mockStanza(
      MessageType.GROUPCHAT,
      EventType.REJECTED,
      fromParticipant.id,
      toParticipant.id,
      targetParticipant,
    );

    fetchMock.mock(
      `/api/videos/${video.id}/participants-asking-to-join/`,
      JSON.stringify({}),
      { method: 'DELETE' },
    );

    await marshaJoinDiscussionPluginHandler(stanza, username, video);

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/participants-asking-to-join/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
      body: JSON.stringify(targetParticipant),
    });
  });

  it('rejects a user in discussion', async () => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: false,
          },
        } as any),
    });
    const video = videoMockFactory();
    const stanza = mockStanza(
      MessageType.EVENT,
      EventType.KICK,
      fromParticipant.id,
      toParticipant.id,
    );

    expect(useParticipantWorkflow.getState().kicked).toBe(false);

    await marshaJoinDiscussionPluginHandler(stanza, username, video);

    expect(useParticipantWorkflow.getState().kicked).toBe(true);
  });

  it('executes removeParticipantFromDiscussion when kicked', async () => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: true,
          },
        } as any),
    });
    const video = videoMockFactory({
      participants_in_discussion: [targetParticipant],
    });
    const stanza = mockStanza(
      MessageType.GROUPCHAT,
      EventType.KICKED,
      fromParticipant.id,
      toParticipant.id,
      targetParticipant,
    );

    fetchMock.mock(
      `/api/videos/${video.id}/participants-in-discussion/`,
      JSON.stringify({}),
      { method: 'DELETE' },
    );

    await marshaJoinDiscussionPluginHandler(stanza, username, video);

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/participants-in-discussion/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
      body: JSON.stringify(targetParticipant),
    });
  });

  it('executes removeParticipantFromDiscussion when leaving', async () => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: true,
          },
        } as any),
    });
    const video = videoMockFactory({
      participants_in_discussion: [fromParticipant],
    });
    const stanza = mockStanza(
      MessageType.GROUPCHAT,
      EventType.LEAVE,
      fromParticipant.id,
      toParticipant.id,
    );

    fetchMock.mock(
      `/api/videos/${video.id}/participants-in-discussion/`,
      JSON.stringify({}),
      { method: 'DELETE' },
    );

    await marshaJoinDiscussionPluginHandler(stanza, username, video);

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/videos/${video.id}/participants-in-discussion/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
      body: JSON.stringify({
        id: fromParticipant.id,
        name: username,
      }),
    });
  });
});

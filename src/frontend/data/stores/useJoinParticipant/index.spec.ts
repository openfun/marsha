import { useJoinParticipant } from '.';

describe('useJoinParticipant', () => {
  it('executes addParticipantAskingToJoin/removeParticipantAskingToJoin', () => {
    // initial state
    expect(useJoinParticipant.getState()).toEqual(
      expect.objectContaining({
        participantsAskingToJoin: [],
        participantsInDiscussion: [],
      }),
    );

    const participant = {
      id: 'particpant1',
      name: 'John Doe',
    };

    useJoinParticipant.getState().addParticipantAskingToJoin(participant);

    expect(useJoinParticipant.getState()).toEqual(
      expect.objectContaining({
        participantsAskingToJoin: [participant],
        participantsInDiscussion: [],
      }),
    );

    useJoinParticipant.getState().removeParticipantAskingToJoin(participant);

    expect(useJoinParticipant.getState()).toEqual(
      expect.objectContaining({
        participantsAskingToJoin: [],
        participantsInDiscussion: [],
      }),
    );
  });

  it('executes addParticipantToDiscussion/removeParticipantInDiscussion', () => {
    expect(useJoinParticipant.getState()).toEqual(
      expect.objectContaining({
        participantsAskingToJoin: [],
        participantsInDiscussion: [],
      }),
    );

    const participant = {
      id: 'particpant1',
      name: 'John Doe',
    };

    useJoinParticipant.getState().addParticipantToDiscussion(participant);

    expect(useJoinParticipant.getState()).toEqual(
      expect.objectContaining({
        participantsAskingToJoin: [],
        participantsInDiscussion: [participant],
      }),
    );

    useJoinParticipant.getState().removeParticipantInDiscussion(participant);

    expect(useJoinParticipant.getState()).toEqual(
      expect.objectContaining({
        participantsAskingToJoin: [],
        participantsInDiscussion: [],
      }),
    );
  });

  it('executes moveParticipantToDiscussion', () => {
    // initial state
    expect(useJoinParticipant.getState()).toEqual(
      expect.objectContaining({
        participantsAskingToJoin: [],
        participantsInDiscussion: [],
      }),
    );

    const participant = {
      id: 'particpant1',
      name: 'John Doe',
    };

    useJoinParticipant.getState().addParticipantAskingToJoin(participant);

    expect(useJoinParticipant.getState()).toEqual(
      expect.objectContaining({
        participantsAskingToJoin: [participant],
        participantsInDiscussion: [],
      }),
    );

    useJoinParticipant.getState().moveParticipantToDiscussion(participant);

    expect(useJoinParticipant.getState()).toEqual(
      expect.objectContaining({
        participantsAskingToJoin: [],
        participantsInDiscussion: [participant],
      }),
    );
  });
});

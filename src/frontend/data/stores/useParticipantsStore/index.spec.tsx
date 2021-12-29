import { useParticipantsStore } from '.';

const participant1 = {
  isInstructor: true,
  isOnStage: true,
  name: 'Instructor',
};

const participant2 = {
  isInstructor: false,
  isOnStage: true,
  name: 'Student 1',
};

const participant3 = {
  isInstructor: false,
  isOnStage: false,
  name: 'Student 2',
};

describe('useParticipantsStore', () => {
  it('executes useParticipantsStore/addParticipant', () => {
    expect(useParticipantsStore.getState().participants).toEqual([]);

    useParticipantsStore.getState().addParticipant(participant1);
    useParticipantsStore.getState().addParticipant(participant2);
    useParticipantsStore.getState().addParticipant(participant3);

    expect(useParticipantsStore.getState().participants).toEqual([
      participant1,
      participant2,
      participant3,
    ]);
  });

  it('executes useParticipantsStore/pushParticipantOnStage', () => {
    useParticipantsStore.getState().addParticipant(participant2);
    useParticipantsStore.getState().addParticipant(participant3);

    const updatedParticipant3 = {
      ...participant3,
      isOnStage: true,
    };
    useParticipantsStore.getState().pushParticipantOnStage(participant3.name);

    expect(useParticipantsStore.getState().participants).toEqual([
      participant2,
      updatedParticipant3,
    ]);
  });

  it('executes useParticipantsStore/bringDownOnStageParticipant', () => {
    useParticipantsStore.getState().addParticipant(participant2);
    useParticipantsStore.getState().addParticipant(participant3);

    const updatedParticipant2 = {
      ...participant2,
      isOnStage: false,
    };
    useParticipantsStore
      .getState()
      .bringDownOnStageParticipant(participant2.name);

    expect(useParticipantsStore.getState().participants).toEqual([
      updatedParticipant2,
      participant3,
    ]);
  });

  it('executes useParticipantsStore/removeParticipant', () => {
    useParticipantsStore.getState().addParticipant(participant1);
    useParticipantsStore.getState().addParticipant(participant2);

    expect(useParticipantsStore.getState().participants).toEqual([
      participant1,
      participant2,
    ]);
    useParticipantsStore.getState().removeParticipant(participant1.name);
    expect(useParticipantsStore.getState().participants).toEqual([
      participant2,
    ]);
  });
});

import { useParticipantsStore } from '.';

const participant1 = {
  id: 'example.jid.instructor1@prosody.org',
  userJid: 'userJid-instructor1',
  isInstructor: true,
  isOnStage: true,
  name: 'Instructor 1',
};

const participant2 = {
  id: 'example.jid.instructor2@prosody.org',
  userJid: 'userJid-instructor2',
  isInstructor: true,
  isOnStage: true,
  name: 'Instructor 2',
};

const participant3 = {
  id: 'example.jid.student1@prosody.org',
  userJid: 'userJid-student1',
  isInstructor: false,
  isOnStage: true,
  name: 'Student 1',
};

const participant4 = {
  id: 'example.jid.student2@prosody.org',
  userJid: 'userJid-student2',
  isInstructor: false,
  isOnStage: false,
  name: 'Student 2',
};

const sameIdParticipant1 = {
  id: 'example.jid.instructor1@prosody.org',
  userJid: 'userJid-instructor1',
  isInstructor: false,
  isOnStage: false,
  name: 'Generic participant',
};

const sameNameParticipant1 = {
  id: 'example.jid.generic@prosody.org',
  userJid: 'userJid-generic',
  isInstructor: false,
  isOnStage: false,
  name: 'Instructor 1',
};

describe('useParticipantsStore', () => {
  it('executes useParticipantsStore/addParticipant', () => {
    expect(useParticipantsStore.getState().participants).toEqual([]);

    useParticipantsStore.getState().addParticipant(participant4);
    useParticipantsStore.getState().addParticipant(participant1);
    useParticipantsStore.getState().addParticipant(participant3);
    useParticipantsStore.getState().addParticipant(participant2);

    // Expect array to be alphabetically ordered, with instructors first
    expect(useParticipantsStore.getState().participants).toEqual([
      participant1,
      participant2,
      participant3,
      participant4,
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

  it('tries to add participant with same id and same name', () => {
    useParticipantsStore.getState().addParticipant(participant1);
    useParticipantsStore.getState().addParticipant(sameIdParticipant1);
    useParticipantsStore.getState().addParticipant(sameNameParticipant1);

    expect(useParticipantsStore.getState().participants).toEqual([
      participant1,
    ]);
  });
});

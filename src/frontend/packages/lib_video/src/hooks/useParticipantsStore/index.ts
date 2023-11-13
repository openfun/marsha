import { create } from 'zustand';

export type ParticipantType = {
  id: string;
  userJid: string;
  isInstructor: boolean;
  isOnStage: boolean;
  name: string;
};

type State = {
  addParticipant: (newParticipant: ParticipantType) => void;
  participants: ParticipantType[];
  removeParticipant: (participantName: string) => void;
  removeParticipantFromUserJid: (userJid: string) => void;
};

export const useParticipantsStore = create<State>((set) => ({
  participants: [],
  addParticipant: (newParticipant) =>
    set((state) => {
      if (
        !state.participants.some(
          (participant) =>
            participant.name === newParticipant.name ||
            participant.id === newParticipant.id,
        )
      ) {
        return {
          participants: state.participants
            .concat(newParticipant)
            // Order participants alphabetically, with instructors first
            .sort((participantA, participantB) =>
              participantA.isInstructor === participantB.isInstructor
                ? participantA.name.localeCompare(participantB.name)
                : participantA.isInstructor
                  ? -1
                  : 1,
            ),
        };
      } else {
        return { participants: state.participants };
      }
    }),
  removeParticipant: (participantName) =>
    set((state) => ({
      participants: state.participants.filter(
        (participant) => participant.name !== participantName,
      ),
    })),
  removeParticipantFromUserJid: (userJid) =>
    set((state) => ({
      participants: state.participants.filter(
        (participant) => participant.userJid !== userJid,
      ),
    })),
}));

import create from 'zustand';

export type ParticipantType = {
  isInstructor: boolean;
  isOnStage: boolean;
  name: string;
};

type State = {
  addParticipant: (newParticipant: ParticipantType) => void;
  bringDownOnStageParticipant: (participantName: string) => void;
  participants: ParticipantType[];
  pushParticipantOnStage: (participantName: string) => void;
  removeParticipant: (participantName: string) => void;
};

export const useParticipantsStore = create<State>((set) => ({
  participants: [],
  addParticipant: (newParticipant) =>
    set((state) => {
      if (
        !state.participants.some(
          (participant) => participant.name === newParticipant.name,
        )
      ) {
        return {
          participants: state.participants
            .concat({
              isInstructor: newParticipant.isInstructor,
              isOnStage: newParticipant.isOnStage,
              name: newParticipant.name,
            })
            .sort((participantA, participantB) =>
              participantA.name.localeCompare(participantB.name),
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
  pushParticipantOnStage: (participantName) =>
    set((state) => ({
      participants: state.participants.map((participant) => {
        if (participant.name === participantName) {
          participant.isOnStage = true;
        }
        return participant;
      }),
    })),
  bringDownOnStageParticipant: (participantName) =>
    set((state) => ({
      participants: state.participants.map((participant) => {
        if (participant.name === participantName) {
          participant.isOnStage = false;
        }
        return participant;
      }),
    })),
}));

import create from 'zustand';
import { Participant } from '../../../types/Participant';

type State = {
  participantsAskingToJoin: Participant[];
  participantsInDiscussion: Participant[];
  addParticipantAskingToJoin: (particpant: Participant) => void;
  addParticipantToDiscussion: (participant: Participant) => void;
  removeParticipantAskingToJoin: (participant: Participant) => void;
  removeParticipantInDiscussion: (participant: Participant) => void;
  moveParticipantToDiscussion: (participant: Participant) => void;
};

export const useJoinParticipant = create<State>((set, get) => ({
  participantsAskingToJoin: [],
  participantsInDiscussion: [],
  addParticipantAskingToJoin: (participant: Participant) => {
    const participantsAskingToJoin = get().participantsAskingToJoin;
    participantsAskingToJoin.push(participant);
    set({
      participantsAskingToJoin,
    });
  },
  addParticipantToDiscussion: (participant: Participant) => {
    const participantsInDiscussion = get().participantsInDiscussion;
    participantsInDiscussion.push(participant);

    set({
      participantsInDiscussion,
    });
  },
  removeParticipantAskingToJoin: (participantToRemove: Participant) => {
    const participantsAskingToJoin = get().participantsAskingToJoin;
    set({
      participantsAskingToJoin: participantsAskingToJoin.filter(
        (participant) => participant.id !== participantToRemove.id,
      ),
    });
  },
  removeParticipantInDiscussion: (participantToRemove: Participant) => {
    const participantsInDiscussion = get().participantsInDiscussion;
    set({
      participantsInDiscussion: participantsInDiscussion.filter(
        (participant) => participant.id !== participantToRemove.id,
      ),
    });
  },
  moveParticipantToDiscussion: (participantToMove: Participant) => {
    const participantsInDiscussion = get().participantsInDiscussion;
    const participantsAskingToJoin = get().participantsAskingToJoin;

    participantsInDiscussion.push(participantToMove);
    set({
      participantsInDiscussion,
      participantsAskingToJoin: participantsAskingToJoin.filter(
        (participant) => participant.id !== participantToMove.id,
      ),
    });
  },
}));

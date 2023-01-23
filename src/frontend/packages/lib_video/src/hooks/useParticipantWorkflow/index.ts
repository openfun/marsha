import { create } from 'zustand';

type State = {
  accepted: boolean;
  asked: boolean;
  kicked: boolean;
  rejected: boolean;
  usernameAlreadyExisting: boolean;
  reset: () => void;
  setAccepted: () => void;
  setAsked: () => void;
  setKicked: () => void;
  setRejected: () => void;
  setUsernameAlreadyExisting: () => void;
};

export const useParticipantWorkflow = create<State>((set) => ({
  accepted: false,
  asked: false,
  kicked: false,
  rejected: false,
  usernameAlreadyExisting: false,
  setAsked: () => {
    set({
      asked: true,
      accepted: false,
      rejected: false,
      kicked: false,
      usernameAlreadyExisting: false,
    });
  },
  setAccepted: () => {
    set({
      asked: false,
      accepted: true,
      rejected: false,
      usernameAlreadyExisting: false,
      kicked: false,
    });
  },
  setRejected: () => {
    set({
      asked: false,
      accepted: false,
      rejected: true,
      usernameAlreadyExisting: false,
      kicked: false,
    });
  },
  setUsernameAlreadyExisting: () => {
    set({
      usernameAlreadyExisting: true,
    });
  },
  setKicked: () => {
    set({
      asked: false,
      accepted: false,
      rejected: false,
      usernameAlreadyExisting: false,
      kicked: true,
    });
  },
  reset: () => {
    set({
      asked: false,
      accepted: false,
      rejected: false,
      usernameAlreadyExisting: false,
      kicked: false,
    });
  },
}));

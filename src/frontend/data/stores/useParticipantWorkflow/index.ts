import create from 'zustand';

type State = {
  accepted: boolean;
  asked: boolean;
  kicked: boolean;
  rejected: boolean;
  reset: () => void;
  setAccepted: () => void;
  setAsked: () => void;
  setKicked: () => void;
  setRejected: () => void;
};

export const useParticipantWorkflow = create<State>((set, get) => ({
  asked: false,
  accepted: false,
  rejected: false,
  kicked: false,
  setAsked: () => {
    set({
      asked: true,
      accepted: false,
      rejected: false,
      kicked: false,
    });
  },
  setAccepted: () => {
    set({
      asked: false,
      accepted: true,
      rejected: false,
      kicked: false,
    });
  },
  setRejected: () => {
    set({
      asked: false,
      accepted: false,
      rejected: true,
      kicked: false,
    });
  },
  setKicked: () => {
    set({
      asked: false,
      accepted: false,
      rejected: false,
      kicked: true,
    });
  },
  reset: () => {
    set({
      asked: false,
      accepted: false,
      rejected: false,
      kicked: false,
    });
  },
}));

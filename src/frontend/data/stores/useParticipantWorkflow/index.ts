import create from 'zustand';

type State = {
  asked: boolean;
  accepted: boolean;
  rejected: boolean;
  kicked: boolean;
  setAsked: () => void;
  setAccepted: () => void;
  setRejected: () => void;
  setKicked: () => void;
  reset: () => void;
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

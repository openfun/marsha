import create from 'zustand';

type State = {
  onRoom: boolean;
  asking: boolean;
  nickname: string | undefined;
  setAsking: (newState: boolean) => void;
  setNickname: (newNickname: string) => void;
  setJoinRoom: (newNickname: string) => void;
  setLeaveRoom: () => void;
  reset: () => void;
};

export const useUserWorkflow = create<State>((set, get) => ({
  onRoom: false,
  asking: false,
  nickname: undefined,
  setAsking: (newState: boolean) => {
    set({
      asking: newState
    })
  },
  setNickname: (newNickname: string) => {
    set({
      nickname: newNickname,
    });
  },
  setJoinRoom: (newNickname: string) => {
    set({
      onRoom: true,
      nickname: newNickname,
    });
  },
  setLeaveRoom: () => {
    set({
      onRoom: false
    });
  },
  reset: () => {
    set({
      onRoom: false,
      asking: false,
      nickname: undefined
    });
  },
}));

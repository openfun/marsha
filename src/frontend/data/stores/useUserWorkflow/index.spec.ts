import { useUserWorkflow } from '.';

describe('useUserWorkflow', () => {
  it('executes setAsking', () => {
    // initial state
    expect(useUserWorkflow.getState()).toEqual(
      expect.objectContaining({
        onRoom: false,
        asking: false,
        nickname: undefined,
      }),
    );
    useUserWorkflow.getState().setAsking(true);
    expect(useUserWorkflow.getState()).toEqual(
      expect.objectContaining({
        onRoom: false,
        asking: true,
        nickname: undefined,
      }),
    );
  });

  it('executes setNickname', () => {
    // initial state
    expect(useUserWorkflow.getState()).toEqual(
      expect.objectContaining({
        onRoom: false,
        asking: false,
        nickname: undefined,
      }),
    );
    useUserWorkflow.getState().setNickname("test");
    expect(useUserWorkflow.getState()).toEqual(
      expect.objectContaining({
        onRoom: false,
        asking: false,
        nickname: "test",
      }),
    );
  });

  it('executes setJoinRoom', () => {
    // initial state
    expect(useUserWorkflow.getState()).toEqual(
      expect.objectContaining({
        onRoom: false,
        asking: false,
        nickname: undefined,
      }),
    );
    useUserWorkflow.getState().setJoinRoom("test");
    expect(useUserWorkflow.getState()).toEqual(
      expect.objectContaining({
        onRoom: true,
        asking: false,
        nickname: "test",
      }),
    );
  });

  it('executes setLeaveRoom', () => {
    // initial state
    expect(useUserWorkflow.getState()).toEqual(
      expect.objectContaining({
        onRoom: false,
        asking: false,
        nickname: undefined,
      }),
    );
    useUserWorkflow.getState().setJoinRoom("test");
    expect(useUserWorkflow.getState()).toEqual(
      expect.objectContaining({
        onRoom: true,
        asking: false,
        nickname: "test",
      }),
    );
    useUserWorkflow.getState().setLeaveRoom();
    expect(useUserWorkflow.getState()).toEqual(
      expect.objectContaining({
        onRoom: false,
        asking: false,
        nickname: "test",
      }),
    );
  });

  it('executes reset', () => {
    // initial state
    expect(useUserWorkflow.getState()).toEqual(
      expect.objectContaining({
        onRoom: false,
        asking: false,
        nickname: undefined,
      }),
    );
    useUserWorkflow.getState().setJoinRoom("test");
    expect(useUserWorkflow.getState()).toEqual(
      expect.objectContaining({
        onRoom: true,
        asking: false,
        nickname: "test",
      }),
    );

    useUserWorkflow.getState().reset();
    expect(useUserWorkflow.getState()).toEqual(
      expect.objectContaining({
        onRoom: false,
        asking: false,
        nickname: undefined,
      }),
    );
  });
});

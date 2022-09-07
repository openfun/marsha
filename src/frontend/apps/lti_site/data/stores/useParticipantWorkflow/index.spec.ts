import { useParticipantWorkflow } from '.';

describe('useParticipantWorkflow', () => {
  it('executes setAsked', () => {
    // initial state
    expect(useParticipantWorkflow.getState()).toEqual(
      expect.objectContaining({
        asked: false,
        accepted: false,
        rejected: false,
        kicked: false,
      }),
    );
    useParticipantWorkflow.getState().setAsked();
    expect(useParticipantWorkflow.getState()).toEqual(
      expect.objectContaining({
        asked: true,
        accepted: false,
        rejected: false,
        kicked: false,
      }),
    );
  });

  it('executes setAccepted', () => {
    // initial state
    expect(useParticipantWorkflow.getState()).toEqual(
      expect.objectContaining({
        asked: false,
        accepted: false,
        rejected: false,
        kicked: false,
      }),
    );
    useParticipantWorkflow.getState().setAccepted();
    expect(useParticipantWorkflow.getState()).toEqual(
      expect.objectContaining({
        asked: false,
        accepted: true,
        rejected: false,
        kicked: false,
      }),
    );
  });

  it('executes setRejected', () => {
    // initial state
    expect(useParticipantWorkflow.getState()).toEqual(
      expect.objectContaining({
        asked: false,
        accepted: false,
        rejected: false,
        kicked: false,
      }),
    );
    useParticipantWorkflow.getState().setRejected();
    expect(useParticipantWorkflow.getState()).toEqual(
      expect.objectContaining({
        asked: false,
        accepted: false,
        rejected: true,
        kicked: false,
      }),
    );
  });

  it('executes setKicked', () => {
    // initial state
    expect(useParticipantWorkflow.getState()).toEqual(
      expect.objectContaining({
        asked: false,
        accepted: false,
        rejected: false,
        kicked: false,
      }),
    );
    useParticipantWorkflow.getState().setKicked();
    expect(useParticipantWorkflow.getState()).toEqual(
      expect.objectContaining({
        asked: false,
        accepted: false,
        rejected: false,
        kicked: true,
      }),
    );
  });

  it('executes reset', () => {
    // initial state
    expect(useParticipantWorkflow.getState()).toEqual(
      expect.objectContaining({
        asked: false,
        accepted: false,
        rejected: false,
        kicked: false,
      }),
    );
    useParticipantWorkflow.getState().setKicked();
    expect(useParticipantWorkflow.getState()).toEqual(
      expect.objectContaining({
        asked: false,
        accepted: false,
        rejected: false,
        kicked: true,
      }),
    );

    useParticipantWorkflow.getState().reset();
    expect(useParticipantWorkflow.getState()).toEqual(
      expect.objectContaining({
        asked: false,
        accepted: false,
        rejected: false,
        kicked: false,
      }),
    );
  });
});

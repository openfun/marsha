import { v4 as uuidv4 } from 'uuid';

import { getLiveRegistrations } from 'data/sideEffects/getLiveRegistrations';
import { pushAttendance } from 'data/sideEffects/pushAttendance';
import { useLiveRegistration } from 'data/stores/useLiveRegistration';
import { liveState } from 'types/tracks';
import { checkLtiToken } from './checkLtiToken';
import { initWebinarContext } from './initWebinarContext';
import { getAnonymousId } from './localstorage';
import { liveRegistrationFactory, videoMockFactory } from './tests/factories';

jest.mock('data/sideEffects/getLiveRegistrations', () => ({
  getLiveRegistrations: jest.fn(),
}));

jest.mock('data/sideEffects/pushAttendance', () => ({
  pushAttendance: jest.fn(),
}));

jest.mock('./checkLtiToken', () => ({
  checkLtiToken: jest.fn(),
}));

jest.mock('./localstorage', () => ({
  getAnonymousId: jest.fn(),
}));

jest.mock('data/appData', () => ({
  getDecodedJwt: jest.fn(),
}));

const mockGetLiveRegistrations = getLiveRegistrations as jest.MockedFunction<
  typeof getLiveRegistrations
>;
const mockPushAttendance = pushAttendance as jest.MockedFunction<
  typeof pushAttendance
>;
const mockCheckLtiToken = checkLtiToken as jest.MockedFunction<
  typeof checkLtiToken
>;
const mockGetAnonymousId = getAnonymousId as jest.MockedFunction<
  typeof getAnonymousId
>;

describe('initWebinarContext', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('does nothing if the video is not a live', async () => {
    const video = videoMockFactory();

    await initWebinarContext(video);

    expect(mockCheckLtiToken).not.toHaveBeenCalled();
    expect(mockGetLiveRegistrations).not.toHaveBeenCalled();
    expect(mockPushAttendance).not.toHaveBeenCalled();
    expect(useLiveRegistration.getState().liveRegistration).toBeUndefined();
  });

  it('does nothing if a live registration is already in the store', async () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
    });
    const liveRegistration = liveRegistrationFactory();
    useLiveRegistration.getState().setLiveRegistration(liveRegistration);

    await initWebinarContext(video);

    expect(mockCheckLtiToken).not.toHaveBeenCalled();
    expect(mockGetLiveRegistrations).not.toHaveBeenCalled();
    expect(mockPushAttendance).not.toHaveBeenCalled();
  });

  it('adds the live registration to the store when back returns one without anonymous_id', async () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
    });
    const liveRegistration = liveRegistrationFactory();

    mockCheckLtiToken.mockReturnValue(true);
    mockGetLiveRegistrations.mockResolvedValue({
      count: 1,
      results: [liveRegistration],
    });

    await initWebinarContext(video);

    expect(mockCheckLtiToken).toHaveBeenCalled();
    expect(mockGetLiveRegistrations).toHaveBeenCalledWith(undefined);
    expect(mockPushAttendance).not.toHaveBeenCalled();

    expect(useLiveRegistration.getState().liveRegistration).toEqual(
      liveRegistration,
    );
  });

  it('adds the live registration to the store when back returns one with anonymous_id', async () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
    });
    const anonymousId = uuidv4();
    const liveRegistration = liveRegistrationFactory({
      anonymous_id: anonymousId,
      video: video.id,
    });

    mockCheckLtiToken.mockReturnValue(false);
    mockGetAnonymousId.mockReturnValue(anonymousId);
    mockGetLiveRegistrations.mockResolvedValue({
      count: 1,
      results: [liveRegistration],
    });

    await initWebinarContext(video);

    expect(mockCheckLtiToken).toHaveBeenCalled();
    expect(mockGetLiveRegistrations).toHaveBeenCalledWith(anonymousId);
    expect(mockPushAttendance).not.toHaveBeenCalled();

    expect(useLiveRegistration.getState().liveRegistration).toEqual(
      liveRegistration,
    );
  });

  it('push an empty attendance when the live registration is not existing yet without anonymous_id', async () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
    });
    const liveRegistration = liveRegistrationFactory();

    mockCheckLtiToken.mockReturnValue(true);
    mockGetLiveRegistrations.mockResolvedValue({
      count: 0,
      results: [],
    });
    mockPushAttendance.mockResolvedValue(liveRegistration);

    await initWebinarContext(video);

    expect(mockCheckLtiToken).toHaveBeenCalled();
    expect(mockGetLiveRegistrations).toHaveBeenCalledWith(undefined);
    expect(mockPushAttendance).toHaveBeenCalledWith({}, undefined);

    expect(useLiveRegistration.getState().liveRegistration).toEqual(
      liveRegistration,
    );
  });

  it('push an empty attendance when the live registration is not existing yet with anonymous_id', async () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
    });
    const anonymousId = uuidv4();
    const liveRegistration = liveRegistrationFactory({
      anonymous_id: anonymousId,
      video: video.id,
    });

    mockCheckLtiToken.mockReturnValue(false);
    mockGetAnonymousId.mockReturnValue(anonymousId);
    mockGetLiveRegistrations.mockResolvedValue({
      count: 0,
      results: [],
    });
    mockPushAttendance.mockResolvedValue(liveRegistration);

    await initWebinarContext(video);

    expect(mockCheckLtiToken).toHaveBeenCalled();
    expect(mockGetLiveRegistrations).toHaveBeenCalledWith(anonymousId);
    expect(mockPushAttendance).toHaveBeenCalledWith({}, anonymousId);

    expect(useLiveRegistration.getState().liveRegistration).toEqual(
      liveRegistration,
    );
  });
});

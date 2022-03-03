import { v4 as uuidv4 } from 'uuid';
import { getDecodedJwt } from 'data/appData';
import { getLiveRegistrations } from 'data/sideEffects/getLiveRegistrations';
import { pushAttendance } from 'data/sideEffects/pushAttendance';
import { useLiveRegistration } from 'data/stores/useLiveRegistration';
import { liveState } from 'types/tracks';
import { checkLtiToken } from './checkLtiToken';
import { initWebinarContext } from './initWebinarContext';
import { getAnonymousId, setAnonymousId } from './localstorage';
import { liveRegistrationFactory, videoMockFactory } from './tests/factories';

jest.mock('data/sideEffects/getLiveRegistrations', () => ({
  getLiveRegistrations: jest.fn(),
  liveRegistrationFactory: jest.fn(),
}));

jest.mock('data/sideEffects/pushAttendance', () => ({
  pushAttendance: jest.fn(),
}));

jest.mock('./checkLtiToken', () => ({
  checkLtiToken: jest.fn(),
}));

jest.mock('./localstorage', () => ({
  getAnonymousId: jest.fn(),
  setAnonymousId: jest.fn(),
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
const mockSetAnonymousId = setAnonymousId as jest.MockedFunction<
  typeof setAnonymousId
>;
const mockGetDecodedJwt = getDecodedJwt as jest.MockedFunction<
  typeof getDecodedJwt
>;

const publicToken = {
  locale: 'en',
  maintenance: false,
  permissions: {
    can_access_dashboard: false,
    can_update: false,
  },
  resource_id: '26debfee-8c3b-4c23-b08f-67f223de9832',
  roles: ['none'],
  session_id: '6bbb8d1d-442d-4575-a0ad-d1e34f37cae3',
};

const ltiToken = {
  context_id: 'course-v1:ufr+mathematics+0001',
  consumer_site: '112cf553-b8c3-4b98-9d47-d0793284b9b3',
  locale: 'en_US',
  maintenance: false,
  permissions: {
    can_access_dashboard: false,
    can_update: false,
  },
  resource_id: '26debfee-8c3b-4c23-b08f-67f223de9832',
  roles: ['student'],
  session_id: '6bbb8d1d-442d-4575-a0ad-d1e34f37cae3',
  user: {
    email: 'sarah@test-mooc.fr',
    id: 'aaace992-49e3-4e01-b809-7a84b1b55b72',
    username: null,
  },
};

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

    expect(mockSetAnonymousId).not.toHaveBeenCalled();
    expect(mockCheckLtiToken).not.toHaveBeenCalled();
    expect(mockGetLiveRegistrations).not.toHaveBeenCalled();
    expect(mockPushAttendance).not.toHaveBeenCalled();
  });

  it('adds the live registration to the store when back returns one without anonymous_id', async () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
    });
    const liveRegistration = liveRegistrationFactory();
    mockGetDecodedJwt.mockReturnValue(ltiToken);
    mockCheckLtiToken.mockReturnValue(true);
    mockGetLiveRegistrations.mockResolvedValue({
      count: 1,
      results: [liveRegistration],
    });

    await initWebinarContext(video);

    expect(mockSetAnonymousId).not.toHaveBeenCalled();
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
    mockGetDecodedJwt.mockReturnValue(ltiToken);
    mockCheckLtiToken.mockReturnValue(false);
    mockGetAnonymousId.mockReturnValue(anonymousId);
    mockGetLiveRegistrations.mockResolvedValue({
      count: 1,
      results: [liveRegistration],
    });

    await initWebinarContext(video);

    expect(mockSetAnonymousId).not.toHaveBeenCalled();
    expect(mockCheckLtiToken).toHaveBeenCalled();
    expect(mockGetLiveRegistrations).toHaveBeenCalledWith(anonymousId);
    expect(mockPushAttendance).not.toHaveBeenCalled();

    expect(useLiveRegistration.getState().liveRegistration).toEqual(
      liveRegistration,
    );
  });

  it('push an empty attendance when the live registration is not existing yet without anonymous_id for public access', async () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
    });
    const liveRegistration = liveRegistrationFactory();
    mockGetDecodedJwt.mockReturnValue(publicToken);
    mockCheckLtiToken.mockReturnValue(false);
    mockGetLiveRegistrations.mockResolvedValue({
      count: 0,
      results: [],
    });
    mockPushAttendance.mockResolvedValue(liveRegistration);

    await initWebinarContext(video);

    expect(mockSetAnonymousId).not.toHaveBeenCalled();
    expect(mockCheckLtiToken).toHaveBeenCalled();
    expect(mockGetLiveRegistrations).toHaveBeenCalledWith(undefined);
    expect(mockPushAttendance).toHaveBeenCalledWith({}, undefined);

    expect(useLiveRegistration.getState().liveRegistration).toEqual(
      liveRegistration,
    );
  });

  it('push an empty attendance when the live registration is not existing yet without anonymous_id for lti access', async () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
    });
    const liveRegistration = liveRegistrationFactory();
    mockGetDecodedJwt.mockReturnValue(ltiToken);
    mockCheckLtiToken.mockReturnValue(true);
    mockGetLiveRegistrations.mockResolvedValue({
      count: 0,
      results: [],
    });
    mockPushAttendance.mockResolvedValue(liveRegistration);

    await initWebinarContext(video);

    expect(mockSetAnonymousId).not.toHaveBeenCalled();
    expect(mockCheckLtiToken).toHaveBeenCalled();
    expect(mockGetLiveRegistrations).toHaveBeenCalledWith(undefined);
    expect(mockPushAttendance).toHaveBeenCalledWith({}, undefined);

    expect(useLiveRegistration.getState().liveRegistration).toEqual(
      liveRegistration,
    );
  });

  it('push an empty attendance when the live registration is not existing yet with anonymous_id for public access', async () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
    });
    const anonymousId = uuidv4();
    mockGetDecodedJwt.mockReturnValue(publicToken);
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
    expect(mockSetAnonymousId).not.toHaveBeenCalled();
    expect(mockCheckLtiToken).toHaveBeenCalled();
    expect(mockGetLiveRegistrations).toHaveBeenCalledWith(anonymousId);
    expect(mockPushAttendance).toHaveBeenCalledWith({}, anonymousId);

    expect(useLiveRegistration.getState().liveRegistration).toEqual(
      liveRegistration,
    );
  });

  it('push an empty attendance when the live registration is not existing yet with anonymous_id for lti access', async () => {
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
    });
    const anonymousId = uuidv4();
    mockGetDecodedJwt.mockReturnValue(ltiToken);
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
    expect(mockSetAnonymousId).not.toHaveBeenCalled();
    expect(mockCheckLtiToken).toHaveBeenCalled();
    expect(mockGetLiveRegistrations).toHaveBeenCalledWith(anonymousId);
    expect(mockPushAttendance).toHaveBeenCalledWith({}, anonymousId);

    expect(useLiveRegistration.getState().liveRegistration).toEqual(
      liveRegistration,
    );
  });
  it('adds the live registration to the store when anonymous_id is already contained in the jwt token', async () => {
    const anonymousId = uuidv4();
    const video = videoMockFactory({
      live_state: liveState.RUNNING,
    });
    // Token generated for a public ressource from email, contains the property anonymous_id and email
    mockGetDecodedJwt.mockReturnValue({
      locale: 'en',
      maintenance: false,
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
      resource_id: 'ressource_id',
      roles: ['student'],
      session_id: 'session_id',
      user: {
        anonymous_id: anonymousId,
        email: 'test@openfun.fr',
      },
    });

    const liveRegistration = liveRegistrationFactory({
      anonymous_id: anonymousId,
      video: video.id,
    });

    mockGetLiveRegistrations.mockResolvedValue({
      count: 1,
      results: [liveRegistration],
    });

    await initWebinarContext(video);
    expect(mockSetAnonymousId).toHaveBeenCalledWith(anonymousId);
    expect(mockCheckLtiToken).not.toHaveBeenCalled();
    expect(mockGetLiveRegistrations).toHaveBeenCalledWith(anonymousId);
    expect(mockPushAttendance).not.toHaveBeenCalled();

    expect(useLiveRegistration.getState().liveRegistration).toEqual(
      liveRegistration,
    );
  });
});

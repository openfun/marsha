import { useJwt } from 'data/stores/useJwt';
import { v4 as uuidv4 } from 'uuid';

import { getOrInitAnonymousId } from './getOrInitAnonymousId';
import { getAnonymousId, setAnonymousId } from './localstorage';

jest.mock('./localstorage', () => ({
  getAnonymousId: jest.fn(),
  setAnonymousId: jest.fn(),
}));
const mockGetAnonymousId = getAnonymousId as jest.MockedFunction<
  typeof getAnonymousId
>;
const mockSetAnonymousId = setAnonymousId as jest.MockedFunction<
  typeof setAnonymousId
>;

const mockGetDecodedJwt = jest.fn();

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

describe('initAnonymousId', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    useJwt.setState({ getDecodedJwt: mockGetDecodedJwt });
  });

  it('set the anonymous_is when present in the token and return it', () => {
    const anonymousId = uuidv4();
    mockGetDecodedJwt.mockReturnValue({
      ...publicToken,
      user: {
        anonymous_id: anonymousId,
        email: null,
      },
    });

    expect(getOrInitAnonymousId()).toEqual(anonymousId);
    expect(mockSetAnonymousId).toHaveBeenCalledWith(anonymousId);
    expect(mockGetAnonymousId).not.toHaveBeenCalled();
  });

  it('generates a new anonymous_id when the public token does not contains one', () => {
    const anonynousId = uuidv4();
    mockGetDecodedJwt.mockReturnValue(publicToken);
    mockGetAnonymousId.mockReturnValue(anonynousId);

    expect(getOrInitAnonymousId()).toEqual(anonynousId);
    expect(mockSetAnonymousId).not.toHaveBeenCalled();
    expect(mockGetAnonymousId).toHaveBeenCalled();
  });

  it('does nothing when the token is not a public one', () => {
    mockGetDecodedJwt.mockReturnValue(ltiToken);

    expect(getOrInitAnonymousId()).toBeUndefined();
    expect(mockSetAnonymousId).not.toHaveBeenCalled();
    expect(mockGetAnonymousId).not.toHaveBeenCalled();
  });
});

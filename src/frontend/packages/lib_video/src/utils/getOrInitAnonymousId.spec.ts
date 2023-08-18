import {
  DecodedJwtLTI,
  decodeJwt,
  useCurrentUser,
  useJwt,
} from 'lib-components';
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
const webToken = {
  token_type: 'website',
  exp: 123456,
  iat: 2345,
  jti: '7889',
  user_id: '1324',
};

const ltiToken: DecodedJwtLTI = {
  context_id: 'course-v1:ufr+mathematics+0001',
  consumer_site: '112cf553-b8c3-4b98-9d47-d0793284b9b3',
  locale: 'en_US',
  maintenance: false,
  permissions: {
    can_access_dashboard: false,
    can_update: false,
  },
  playlist_id: '26debfee-8c3b-4c23-b08f-67f223de9832',
  roles: ['student'],
  session_id: '6bbb8d1d-442d-4575-a0ad-d1e34f37cae3',
  user: {
    email: 'sarah@test-mooc.fr',
    id: 'aaace992-49e3-4e01-b809-7a84b1b55b72',
    username: null,
  },
};

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  decodeJwt: jest.fn(),
}));
const mockedDecodeJwt = decodeJwt as jest.MockedFunction<typeof decodeJwt>;

describe('initAnonymousId', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('set the anonymous_is when present in the token and return it', () => {
    const anonymousId = uuidv4();
    useJwt.setState({ jwt: publicToken } as any);
    useCurrentUser.setState({
      currentUser: {
        anonymous_id: anonymousId,
      } as any,
    });

    expect(getOrInitAnonymousId()).toEqual(anonymousId);
    expect(mockSetAnonymousId).toHaveBeenCalledWith(anonymousId);
    expect(mockGetAnonymousId).not.toHaveBeenCalled();
  });

  it('generates a new anonymous_id when the public token does not contains one', () => {
    const anonymousId = uuidv4();
    useJwt.setState({ jwt: publicToken } as any);
    useCurrentUser.setState({
      currentUser: undefined,
    });
    mockGetAnonymousId.mockReturnValue(anonymousId);
    mockedDecodeJwt.mockReturnValue(publicToken);

    expect(getOrInitAnonymousId()).toEqual(anonymousId);
    expect(mockSetAnonymousId).not.toHaveBeenCalled();
    expect(mockGetAnonymousId).toHaveBeenCalled();
  });

  it('does nothing when the token is not a website one', () => {
    useJwt.setState({ jwt: webToken } as any);
    useCurrentUser.setState({
      currentUser: undefined,
    });
    mockedDecodeJwt.mockReturnValue(webToken);

    expect(getOrInitAnonymousId()).toBeUndefined();
    expect(mockSetAnonymousId).not.toHaveBeenCalled();
    expect(mockGetAnonymousId).not.toHaveBeenCalled();
  });

  it('generates a new anonymous_id when token is from website and user_id empty', () => {
    const anonymousId = uuidv4();
    const newWebToken = { ...webToken, user_id: '' };
    useJwt.setState({ jwt: newWebToken } as any);
    useCurrentUser.setState({
      currentUser: undefined,
    });
    mockGetAnonymousId.mockReturnValue(anonymousId);
    mockedDecodeJwt.mockReturnValue(newWebToken);

    expect(getOrInitAnonymousId()).toEqual(anonymousId);
    expect(mockSetAnonymousId).not.toHaveBeenCalled();
    expect(mockGetAnonymousId).toHaveBeenCalled();
  });

  it('does nothing when the token is not a public one', () => {
    useJwt.setState({ jwt: ltiToken } as any);
    useCurrentUser.setState({
      currentUser: undefined,
    });
    mockedDecodeJwt.mockReturnValue(ltiToken);

    expect(getOrInitAnonymousId()).toBeUndefined();
    expect(mockSetAnonymousId).not.toHaveBeenCalled();
    expect(mockGetAnonymousId).not.toHaveBeenCalled();
  });
});

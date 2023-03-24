import { ANONYMOUS_ID_PREFIX } from '@lib-video/conf/chat';
import { converse } from '@lib-video/utils/window';

import { generateAnonymousNickname, getNameFromJID, isAnonymous } from './chat';

jest.mock('utils/window', () => ({
  converse: {
    env: {
      Strophe: {
        getResourceFromJid: jest.fn(),
      },
    },
  },
}));

describe('utils/chat/chat/generateAnonymousNickname', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('generates an anonymous nickname.', () => {
    const generatedNickname = generateAnonymousNickname();
    expect(generatedNickname.length).toBe(18);
    expect(generatedNickname.startsWith(ANONYMOUS_ID_PREFIX + '-')).toBe(true);
  });

  it('extracts a username out of a provided JID.', () => {
    getNameFromJID('id_of_the_room@conference.prosody/JohnDoe');
    expect(converse.env.Strophe.getResourceFromJid).toHaveBeenNthCalledWith(
      1,
      'id_of_the_room@conference.prosody/JohnDoe',
    );
    expect(converse.env.Strophe.getResourceFromJid).toHaveBeenCalledTimes(1);
  });
});

describe('utils/chat/chat/isAnonymous', () => {
  it('returns true if name is anonymous', () => {
    expect(isAnonymous(generateAnonymousNickname())).toBe(true);
    expect(isAnonymous(generateAnonymousNickname().toUpperCase())).toBe(true);
  });

  it('returns false for names that are not anonymous', () => {
    expect(isAnonymous('some name')).toBe(false);
    expect(isAnonymous(`efzef-${ANONYMOUS_ID_PREFIX}-faef`)).toBe(false);
  });
});

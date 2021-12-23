import { converse } from 'utils/window';
import {
  generateAnonymousNickname,
  getNameFromJID,
  ANONYMOUS_ID_PREFIX,
} from './chat';

jest.mock('utils/window', () => ({
  converse: {
    env: {
      Strophe: {
        getResourceFromJid: jest.fn(),
      },
    },
  },
}));

describe('utils/chat/chat', () => {
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

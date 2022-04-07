import { ANONYMOUS_ID_PREFIX } from 'default/chat';
import { converse } from 'utils/window';

export const generateAnonymousNickname = () => {
  const tokenLength = 8;
  const charUniverse =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'.split('');
  const generatedToken = [...Array(tokenLength).keys()]
    .map(() => {
      return charUniverse[
        Math.round(Math.random() * (charUniverse.length - 1))
      ];
    })
    .join('');

  return `${ANONYMOUS_ID_PREFIX}-${generatedToken}`;
};

export const getNameFromJID = (jid: string): string => {
  return converse.env.Strophe.getResourceFromJid(jid);
};

export const isAnonymous = (name: string) => {
  return name.toLowerCase().startsWith(`${ANONYMOUS_ID_PREFIX}-`);
};

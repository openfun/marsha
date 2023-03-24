import { defineMessages, IntlShape } from 'react-intl';

import { ParticipantType } from '@lib-video/hooks/useParticipantsStore';
import { isAnonymous } from '@lib-video/utils/chat/chat';

export const sortParticipantNotOnStage = (
  item1: ParticipantType,
  item2: ParticipantType,
) => {
  const isItem1Anonymous = isAnonymous(item1.name);
  const isItem2Anonymous = isAnonymous(item2.name);

  if (!isItem1Anonymous && !isItem2Anonymous) {
    //  item1 and item2 are not anonymous, order them accordingly
    return item1.name.localeCompare(item2.name);
  } else if (!isItem1Anonymous) {
    //  item2 is anonymous and
    return -1;
  } else if (!isItem2Anonymous) {
    //  item1 is anonymous, place it at the end
    return 1;
  } else {
    //  both are anonymous, do not sort
    return 0;
  }
};

const messages = defineMessages({
  noViewers: {
    defaultMessage: 'No viewers are currently connected to your stream.',
    description:
      'Message displayed in the users list when no viewers are connected',
    id: 'components.ViewersList.utils.noViewers',
  },
  anonymousViewersOnly: {
    defaultMessage:
      '{nb} anonymous {nb, plural, one {viewer} other {viewers}}.',
    description:
      'Message displayed in the users list when teacher has only anonymous viewers connected.',
    id: 'components.ViewersList.utils.anonymousViewersOnly',
  },
  anonymousAndNamedViewers: {
    defaultMessage:
      'And {nb} anonymous {nb, plural, one {viewer} other {viewers}}.',
    description:
      'Message displayed in the users list when teacher has anonymous viewers connected and students with a display name.',
    id: 'components.ViewersList.utils.anonymousAndNamedViewers',
  },
});

export const generateSimpleViewersMessage = (
  intl: IntlShape,
  namedViewers: number,
  anonymousViewers: number,
) => {
  if (namedViewers === 0 && anonymousViewers === 0) {
    return intl.formatMessage(messages.noViewers);
  } else if (namedViewers === 0 && anonymousViewers > 0) {
    return intl.formatMessage(messages.anonymousViewersOnly, {
      nb: anonymousViewers,
    });
  } else if (anonymousViewers > 0) {
    return intl.formatMessage(messages.anonymousAndNamedViewers, {
      nb: anonymousViewers,
    });
  } else {
    return undefined;
  }
};

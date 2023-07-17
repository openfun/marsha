import { Video } from 'lib-components';
import { IntlShape, defineMessages } from 'react-intl';

const messages = defineMessages({
  onePersonAsking: {
    defaultMessage: '{name} wants to go on stage.',
    description:
      'Notification message displayed when one person wants to go on stage.',
    id: 'utils.onStageRequestMessage.onePersonAsking',
  },
  twoPersonsAsking: {
    defaultMessage: '{name1} and {name2} want to go on stage.',
    description:
      'Notification message displayed when two persons want to go on stage.',
    id: 'utils.onStageRequestMessage.twoPersonsAsking',
  },
  threePersonsAsking: {
    defaultMessage: '{name1}, {name2} and {name3} want to go on stage.',
    description:
      'Notification message displayed when three persons want to go on stage.',
    id: 'utils.onStageRequestMessage.threePersonsAsking',
  },
  severalPersonsAsking: {
    defaultMessage:
      '{name1}, {name2}, {name3} and {number} others want to go on stage.',
    description:
      'Notification message displayed when several persons want to go on stage.',
    id: 'utils.onStageRequestMessage.severalPersonsAsking',
  },
});

export const onStageRequestMessage = (
  participantsAskingToJoin: Video['participants_asking_to_join'],
  intl: IntlShape,
): string => {
  if (participantsAskingToJoin.length === 1) {
    return intl.formatMessage(messages.onePersonAsking, {
      name: participantsAskingToJoin[0].name,
    });
  } else if (participantsAskingToJoin.length === 2) {
    return intl.formatMessage(messages.twoPersonsAsking, {
      name1: participantsAskingToJoin[1].name,
      name2: participantsAskingToJoin[0].name,
    });
  } else if (participantsAskingToJoin.length === 3) {
    return intl.formatMessage(messages.threePersonsAsking, {
      name1: participantsAskingToJoin[2].name,
      name2: participantsAskingToJoin[1].name,
      name3: participantsAskingToJoin[0].name,
    });
  } else {
    const nbrAsking = participantsAskingToJoin.length;
    return intl.formatMessage(messages.severalPersonsAsking, {
      name1: participantsAskingToJoin[nbrAsking - 1].name,
      name2: participantsAskingToJoin[nbrAsking - 2].name,
      name3: participantsAskingToJoin[nbrAsking - 3].name,
      number: nbrAsking - 3,
    });
  }
};

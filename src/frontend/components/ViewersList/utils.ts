import { ParticipantType } from 'data/stores/useParticipantsStore';
import { isAnonymous } from 'utils/chat/chat';

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

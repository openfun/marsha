import { ParticipantType } from 'data/stores/useParticipantsStore';
import { generateAnonymousNickname } from 'utils/chat/chat';

import { sortParticipantNotOnStage } from './utils';

describe('sortParticipantNotOnStage', () => {
  it('sorts participants', () => {
    const anonymous1: ParticipantType = {
      id: 'id1',
      name: generateAnonymousNickname(),
      isInstructor: false,
      isOnStage: false,
    };
    const anonymous2: ParticipantType = {
      id: 'id2',
      name: generateAnonymousNickname(),
      isInstructor: false,
      isOnStage: false,
    };
    const registered1: ParticipantType = {
      id: 'id3',
      name: 'John Wick',
      isInstructor: false,
      isOnStage: false,
    };
    const registered2: ParticipantType = {
      id: 'id4',
      name: 'Jack Sparrow',
      isInstructor: false,
      isOnStage: false,
    };

    const sorted = [anonymous1, anonymous2, registered1, registered2].sort(
      sortParticipantNotOnStage,
    );

    expect(sorted).toEqual([registered2, registered1, anonymous1, anonymous2]);
  });
});

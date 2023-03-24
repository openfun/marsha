import { createIntl, IntlShape } from 'react-intl';

import { ParticipantType } from '@lib-video/hooks/useParticipantsStore';
import { generateAnonymousNickname } from '@lib-video/utils/chat/chat';

import {
  generateSimpleViewersMessage,
  sortParticipantNotOnStage,
} from './utils';

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

describe('generateSimpleViewersMessage', () => {
  it('returns nobody message when nobody is connected', () => {
    const intl: IntlShape = createIntl({
      locale: 'en',
    });

    expect(generateSimpleViewersMessage(intl, 0, 0)).toEqual(
      'No viewers are currently connected to your stream.',
    );
  });

  it('returns anonymous single count', () => {
    const intl: IntlShape = createIntl({
      locale: 'en',
    });

    expect(generateSimpleViewersMessage(intl, 0, 1)).toEqual(
      '1 anonymous viewer.',
    );
  });

  it('returns anonymous multiple count', () => {
    const intl: IntlShape = createIntl({
      locale: 'en',
    });

    expect(generateSimpleViewersMessage(intl, 0, 4)).toEqual(
      '4 anonymous viewers.',
    );
  });

  it('returns anonymous count with named connected', () => {
    const intl: IntlShape = createIntl({
      locale: 'en',
    });

    expect(generateSimpleViewersMessage(intl, 2, 1)).toEqual(
      'And 1 anonymous viewer.',
    );
  });

  it('returns anonymous count with named connected when several people connected', () => {
    const intl: IntlShape = createIntl({
      locale: 'en',
    });

    expect(generateSimpleViewersMessage(intl, 2, 4)).toEqual(
      'And 4 anonymous viewers.',
    );
  });
});

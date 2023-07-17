import { participantMockFactory } from 'lib-components';
import { IntlShape, createIntl } from 'react-intl';

import { onStageRequestMessage } from './onStageRequestMessage';

const participants = [
  participantMockFactory(),
  participantMockFactory(),
  participantMockFactory(),
  participantMockFactory(),
  participantMockFactory(),
  participantMockFactory(),
  participantMockFactory(),
  participantMockFactory(),
  participantMockFactory(),
  participantMockFactory(),
];

const intl: IntlShape = createIntl({
  locale: 'en',
});

describe('onStageRequestMessage', () => {
  it('generates notification message for only one participant', () => {
    expect(onStageRequestMessage([participants[0]], intl)).toEqual(
      `${participants[0].name} wants to go on stage.`,
    );
  });

  it('generates notification message for two participants', () => {
    const twoParticipants = participants.slice(0, 2);
    expect(onStageRequestMessage(twoParticipants, intl)).toEqual(
      `${twoParticipants[1].name} and ${twoParticipants[0].name} want to go on stage.`,
    );
  });

  it('generates notification message for three participants', () => {
    const threeParticipants = participants.slice(0, 3);
    expect(onStageRequestMessage(threeParticipants, intl)).toEqual(
      `${threeParticipants[2].name}, ${threeParticipants[1].name} and ${threeParticipants[0].name} want to go on stage.`,
    );
  });

  it('generates notification message for more than three participants', () => {
    expect(onStageRequestMessage(participants, intl)).toEqual(
      `${participants[9].name}, ${participants[8].name}, ${participants[7].name} and 7 others want to go on stage.`,
    );
  });
});

import { render } from '@testing-library/react';
import React from 'react';
import { VTTCue } from 'vtt.js';

import { TranscriptSentence } from '.';

describe('<TranscriptSentence />', () => {
  it('displays a simple <Text /> when not active', () => {
    const cue: VTTCue = {
      endTime: 1,
      id: 'e67ba62e-ec93-4e04-a8da-bdaed3655262',
      startTime: 0,
      text: 'Lorem ipsum dolor sit amet.',
    };

    const { getByText } = render(
      <TranscriptSentence cue={cue} active={false} />,
    );
    const sentence = getByText('Lorem ipsum dolor sit amet.');

    expect(sentence.classList).toHaveLength(2);
  });

  it('highlights the text when the sentence is active', () => {
    const cue: VTTCue = {
      endTime: 1,
      id: 'e67ba62e-ec93-4e04-a8da-bdaed3655262',
      startTime: 0,
      text: 'Lorem ipsum dolor sit amet.',
    };

    const { getByText } = render(
      <TranscriptSentence cue={cue} active={true} />,
    );

    const sentence = getByText('Lorem ipsum dolor sit amet.');

    // 2 css rules are added, 2 new class should be added
    expect(sentence.classList).toHaveLength(4);
  });
});

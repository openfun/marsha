import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { VTTCue } from 'vtt.js';

import { TranscriptSentence } from '.';

const mockSetTime = jest.fn();
jest.mock('../../data/stores/useTranscriptTimeSelector', () => ({
  useTranscriptTimeSelector: jest.fn(() => mockSetTime),
}));

describe('<TranscriptSentence />', () => {
  afterEach(jest.clearAllMocks);

  it('displays a simple <Text /> when not active', () => {
    const cue: VTTCue = {
      endTime: 1,
      id: 'e67ba62e-ec93-4e04-a8da-bdaed3655262',
      startTime: 10,
      text: 'Lorem ipsum dolor sit amet.',
    };

    const { getByText } = render(
      <TranscriptSentence cue={cue} active={false} />,
    );

    const sentence = getByText('Lorem ipsum dolor sit amet.');

    expect(sentence).not.toHaveStyleRule('background-color');
    expect(sentence).not.toHaveStyleRule('outline');

    fireEvent.click(sentence);
    expect(mockSetTime).toHaveBeenCalledWith(10);
  });

  it('highlights the text when the sentence is active', () => {
    const cue: VTTCue = {
      endTime: 1,
      id: 'e67ba62e-ec93-4e04-a8da-bdaed3655262',
      startTime: 20,
      text: 'Lorem ipsum dolor sit amet.',
    };

    const { getByText, asFragment } = render(
      <TranscriptSentence cue={cue} active={true} />,
    );

    const sentence = getByText('Lorem ipsum dolor sit amet.');
    const child = asFragment().firstElementChild;

    if (!child) {
      fail('Component does not render as expected');
    }

    const computedStyle = window.getComputedStyle(child);

    expect(computedStyle.getPropertyValue('background-color')).toMatch(
      /rgba(.*)/,
    );
    expect(computedStyle.getPropertyValue('outline')).toMatch(
      /1px solid rgba(.*)/,
    );

    fireEvent.click(sentence);
    expect(mockSetTime).toHaveBeenCalledWith(20);
  });
});

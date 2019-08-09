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

    fireEvent.click(getByText('Lorem ipsum dolor sit amet.'));
    expect(mockSetTime).toHaveBeenCalledWith(10);
  });

  it('highlights the text when the sentence is active', () => {
    const cue: VTTCue = {
      endTime: 1,
      id: 'e67ba62e-ec93-4e04-a8da-bdaed3655262',
      startTime: 20,
      text: 'Lorem ipsum dolor sit amet.',
    };

    const { getByText } = render(
      <TranscriptSentence cue={cue} active={true} />,
    );

    fireEvent.click(getByText('Lorem ipsum dolor sit amet.'));
    expect(mockSetTime).toHaveBeenCalledWith(20);
  });
});

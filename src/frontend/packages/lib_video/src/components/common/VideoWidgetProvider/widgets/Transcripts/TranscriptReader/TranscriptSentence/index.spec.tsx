import { fireEvent, screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';
import { VTTCue } from 'vtt.js';

import { TranscriptSentence } from '.';

const mockSetTime = jest.fn();
jest.mock('hooks/useTranscriptTimeSelector', () => ({
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

    render(<TranscriptSentence cue={cue} active={false} />);

    const sentence = screen.getByText('Lorem ipsum dolor sit amet.');

    expect(sentence).not.toHaveClass('sentence-active');

    fireEvent.click(sentence);
    expect(mockSetTime).toHaveBeenCalledWith(10);
  });

  it('displays html', () => {
    const cue: VTTCue = {
      endTime: 1,
      id: 'e67ba62e-ec93-4e04-a8da-bdaed3655262',
      startTime: 10,
      text: 'Lorem <b>ipsum</b> dolor sit amet.',
    };

    render(<TranscriptSentence cue={cue} active={false} />);

    const sentence = screen.getByText('Lorem dolor sit amet.');
    expect(sentence).not.toHaveClass('sentence-active');
    expect(sentence.innerHTML).toEqual('Lorem <b>ipsum</b> dolor sit amet. ');
  });

  it('highlights the text when the sentence is active', () => {
    const cue: VTTCue = {
      endTime: 1,
      id: 'e67ba62e-ec93-4e04-a8da-bdaed3655262',
      startTime: 20,
      text: 'Lorem ipsum dolor sit amet.',
    };

    render(<TranscriptSentence cue={cue} active={true} />);

    const sentence = screen.getByText('Lorem ipsum dolor sit amet.');
    // eslint-disable-next-line testing-library/no-node-access
    expect(sentence.parentElement).toHaveClass('sentence-active');

    fireEvent.click(sentence);
    expect(mockSetTime).toHaveBeenCalledWith(20);
  });
});

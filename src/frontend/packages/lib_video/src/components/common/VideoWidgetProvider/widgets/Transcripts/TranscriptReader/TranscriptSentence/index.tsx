import { Text } from 'grommet';
import * as React from 'react';
import styled from 'styled-components';
import { VTTCue } from 'vtt.js';

import { useTranscriptTimeSelector } from 'hooks/useTranscriptTimeSelector';

const Sentence = styled(Text)`
  cursor: pointer;
  :hover {
    text-decoration: underline;
  }

  &.sentence-active {
    background-color: rgba(242, 94, 35, 0.25);
    outline: 1px solid rgba(242, 94, 35, 0.5);
  }
`;

interface TranscriptSentenceProps {
  cue: VTTCue;
  active: boolean;
}

export const TranscriptSentence = ({
  cue,
  active,
}: TranscriptSentenceProps) => {
  const setTime = useTranscriptTimeSelector((state) => state.setTime);

  const textSentence = () => ({ __html: `${cue.text} ` });

  return (
    <Sentence
      className={active ? 'sentence-active' : ''}
      onClick={() => setTime(cue.startTime)}
    >
      <span dangerouslySetInnerHTML={textSentence()} />
    </Sentence>
  );
};

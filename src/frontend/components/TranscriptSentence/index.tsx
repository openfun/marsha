import { Text } from 'grommet';
import * as React from 'react';
import styled from 'styled-components';
import { VTTCue } from 'vtt.js';

export const ActiveSentence = styled(Text)`
  background-color: rgba(242, 94, 35, 0.25);
  outline: 1px solid rgba(242, 94, 35, 0.5);
`;

interface TranscriptSentenceProps {
  cue: VTTCue;
  active: boolean;
}

export const TranscriptSentence = (props: TranscriptSentenceProps) => {
  const { cue, active } = props;

  if (active) {
    return <ActiveSentence>{cue.text} </ActiveSentence>;
  } else {
    return <Text>{cue.text} </Text>;
  }
};

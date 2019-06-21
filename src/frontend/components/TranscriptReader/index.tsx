import { Box, Paragraph } from 'grommet';
import React, { useState } from 'react';
import { VTTCue, WebVTT } from 'vtt.js';

import { useVideoProgress } from '../../data/stores/useVideoProgress';
import { TimedTextTranscript } from '../../types/tracks';
import { useAsyncEffect } from '../../utils/useAsyncEffect';
import { TranscriptSentence } from '../TranscriptSentence';

interface TranscriptReaderProps {
  transcript: TimedTextTranscript;
}

export const TranscriptReader = ({ transcript }: TranscriptReaderProps) => {
  const [cues, setCues] = useState([] as VTTCue[]);

  const { playerCurrentTime } = useVideoProgress();

  useAsyncEffect(async () => {
    const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());

    const response = await fetch(transcript.url);
    const content = await response.text();
    parser.oncue = (cue: VTTCue) => {
      setCues(prevCues => [...prevCues, cue]);
    };

    parser.parse(content);
    parser.flush();
  }, []);

  return (
    <Box
      align="start"
      direction="row"
      pad="medium"
      overflow="scroll"
      height="small"
    >
      <Paragraph size="xxlarge">
        {cues.map(cue => {
          return (
            <TranscriptSentence
              key={cue.id}
              cue={cue}
              active={
                cue.startTime < playerCurrentTime &&
                cue.endTime > playerCurrentTime
              }
            />
          );
        })}
      </Paragraph>
    </Box>
  );
};

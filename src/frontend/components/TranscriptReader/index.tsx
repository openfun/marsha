import { Box, Paragraph } from 'grommet';
import React, { useState, useEffect, useRef } from 'react';
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

  const playerCurrentTime = useVideoProgress(
    (state) => state.playerCurrentTime,
  );

  useAsyncEffect(async () => {
    const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());

    const response = await fetch(transcript.url);
    const content = await response.text();
    parser.oncue = (cue: VTTCue) => {
      setCues((prevCues) => [...prevCues, cue]);
    };

    parser.parse(content);
    parser.flush();
  }, []);

  const transcriptWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!transcriptWrapperRef.current) return;

    transcriptWrapperRef.current
      .querySelector(`.sentence-active`)
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
  }, [playerCurrentTime]);

  return (
    <Box
      ref={transcriptWrapperRef}
      align="start"
      direction="row"
      pad="medium"
      overflow="scroll"
      height="small"
    >
      <Paragraph size="xxlarge">
        {cues.map((cue) => {
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

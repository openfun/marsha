import { Box, Paragraph } from 'grommet';
import { TimedTextTranscript } from 'lib-components';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VTTCue } from 'vtt.js';

import { useTranscriptReaderRequest } from '@lib-video/api/useTranscriptReaderRequest';
import { useVideoProgress } from '@lib-video/hooks/useVideoProgress';

import { TranscriptSentence } from './TranscriptSentence';

interface TranscriptReaderProps {
  transcript: TimedTextTranscript;
}

export const TranscriptReader = ({ transcript }: TranscriptReaderProps) => {
  const [cues, setCues] = useState([] as VTTCue[]);

  const playerCurrentTime = useVideoProgress(
    (state) => state.playerCurrentTime,
  );

  const onSuccess = useCallback((cue: VTTCue) => {
    setCues((prevCues) => {
      // Dont insert duplicate cues
      return !prevCues.filter((e) => e.id === cue.id).length
        ? [...prevCues, cue]
        : prevCues;
    });
  }, []);

  useTranscriptReaderRequest(transcript.url, onSuccess, {
    keepPreviousData: true,
    staleTime: 20000,
  });

  const transcriptWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!transcriptWrapperRef.current) {
      return;
    }

    const target = transcriptWrapperRef.current.querySelector(
      `.sentence-active`,
    ) as HTMLSpanElement;

    if (target) {
      // Follow active sentence to be always visible.
      transcriptWrapperRef.current.scrollTo({
        top:
          target.offsetTop -
          (transcriptWrapperRef.current.offsetTop +
            transcriptWrapperRef.current.offsetHeight / 2),
        behavior: 'smooth',
      });
    }
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

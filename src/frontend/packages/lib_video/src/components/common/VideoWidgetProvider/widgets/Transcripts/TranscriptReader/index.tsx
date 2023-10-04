import { Box } from 'grommet';
import { Text, TimedTextTranscript } from 'lib-components';
import React, { useEffect, useRef, useState } from 'react';
import { VTTCue, WebVTT } from 'vtt.js';

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

  const { data } = useTranscriptReaderRequest(transcript.id, transcript.url);

  useEffect(() => {
    if (!data) {
      return;
    }

    const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());

    parser.oncue = (cue: VTTCue) => {
      setCues((prevCues) => {
        // Dont insert duplicate cues
        return !prevCues.filter((e) => e.id === cue.id).length
          ? [...prevCues, cue]
          : prevCues;
      });
    };

    parser.parse(data);
    parser.flush();
  }, [data]);

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
      <Text type="p">
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
      </Text>
    </Box>
  );
};

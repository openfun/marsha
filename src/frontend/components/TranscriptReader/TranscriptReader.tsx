import { Box, Paragraph, Text } from 'grommet';
import * as React from 'react';
import { VTTCue, WebVTT } from 'vtt.js';

import { TimedTextTranscript } from '../../types/tracks';
import { TranscriptSentence } from '../TranscriptSentence/TranscriptSentence';

interface TranscriptReaderProps {
  transcript: TimedTextTranscript;
  currentTime: number;
}

interface TranscriptReaderState {
  cues: VTTCue[];
}

export class TranscriptReader extends React.Component<
  TranscriptReaderProps,
  TranscriptReaderState
> {
  constructor(props: TranscriptReaderProps) {
    super(props);

    this.state = {
      cues: [],
    };
  }

  async componentDidMount() {
    const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());

    const response = await fetch(this.props.transcript.url);
    const content = await response.text();
    parser.oncue = (cue: VTTCue) => {
      this.setState(prevState => ({ cues: [...prevState.cues, cue] }));
    };

    parser.parse(content);
    parser.flush();
  }

  render() {
    const { currentTime } = this.props;

    return (
      <Box
        align="start"
        direction="row"
        pad="medium"
        overflow="scroll"
        height="small"
      >
        <Paragraph size="xxlarge">
          {this.state.cues.map(cue => {
            return (
              <TranscriptSentence
                key={cue.id}
                cue={cue}
                active={
                  cue.startTime < currentTime && cue.endTime > currentTime
                }
              />
            );
          })}
        </Paragraph>
      </Box>
    );
  }
}

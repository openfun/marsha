import { connect } from 'react-redux';

import { RootState } from '../../data/rootReducer';
import { appStateSuccess } from '../../types/AppData';
import { TranscriptReader } from '../TranscriptReader/TranscriptReader';

export const mapStateToProps = (state: RootState<appStateSuccess>) => ({
  currentTime: state.player.currentTime,
});

export const TranscriptReaderConnected = connect(mapStateToProps)(
  TranscriptReader,
);

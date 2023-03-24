import { TimedText, timedTextMode, report } from 'lib-components';

import { VideoPlayerCreator } from '@lib-video/types/VideoPlayer';

import { createVideojsPlayer } from './createVideojsPlayer';

export const createPlayer: VideoPlayerCreator = (
  type,
  ref,
  dispatchPlayerTimeUpdate,
  video,
  locale,
  onReady = undefined,
) => {
  switch (type) {
    case 'videojs':
      const player = createVideojsPlayer(
        ref,
        dispatchPlayerTimeUpdate,
        video,
        locale,
        onReady,
      );

      const trackTextKind: {
        [key in timedTextMode]?: videojs.default.TextTrack.Kind;
      } = {
        [timedTextMode.CLOSED_CAPTIONING]: 'captions',
        [timedTextMode.SUBTITLE]: 'subtitles',
      };

      const addTrackToPlayer = (
        track: TimedText,
        languages: { [key: string]: string },
      ) => {
        player.addRemoteTextTrack(
          {
            id: track.id,
            src: track.url,
            language: track.language,
            kind: trackTextKind[track.mode],
            label: languages[track.language] || track.language,
          },
          true,
        );
      };

      const removeTrackFromPlayer = (track: TimedText) => {
        if (track.id) {
          player.removeRemoteTextTrack(
            player
              .remoteTextTracks()
              .getTrackById(track.id) as unknown as HTMLTrackElement,
          );
        }
      };

      return {
        addTrack: (track: TimedText, languages: { [key: string]: string }) =>
          addTrackToPlayer(track, languages),
        removeTrack: (track: TimedText) => removeTrackFromPlayer(track),
        destroy: () => player.dispose(),
        getSource: () => player.currentSource().src,
        setSource: (url: string) => player.src(url),
      };
    default:
      const error = new Error(`player ${type} not implemented`);
      report(error);
      throw error;
  }
};

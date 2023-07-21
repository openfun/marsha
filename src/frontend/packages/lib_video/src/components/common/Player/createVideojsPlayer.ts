import 'video.js/dist/video-js.css';

import 'videojs-contrib-quality-levels';
import 'videojs-http-source-selector';
import './videojs/qualitySelectorPlugin';
import './videojs/p2pHlsPlugin';
import './videojs/downloadVideoPlugin';
import './videojs/id3Plugin';
import './videojs/xapiPlugin';
import './videojs/sharedMediaPlugin';

import { Maybe } from 'lib-common';
import { Video, useP2PConfig, videoSize } from 'lib-components';
import videojs, {
  VideoJsPlayer,
  VideoJsPlayerOptions,
  VideoJsPlayerPluginOptions,
} from 'video.js';

import { useTranscriptTimeSelector } from '@lib-video/hooks/useTranscriptTimeSelector';
import { VideoJsExtendedSourceObject } from '@lib-video/types/libs/video.js/extend';
import { isMSESupported } from '@lib-video/utils/isMSESupported';

export const createVideojsPlayer = (
  videoNode: HTMLVideoElement,
  dispatchPlayerTimeUpdate: (time: number) => void,
  video: Video,
  locale: Maybe<string>,
  onReady: Maybe<(player: VideoJsPlayer) => void> = undefined,
): VideoJsPlayer => {
  const { isP2PEnabled } = useP2PConfig.getState();
  // This property should be deleted once the feature has been
  // deployed, tested and approved in a production environment
  const isP2pQueryEnabled = new URLSearchParams(window.location.search).has(
    'p2p',
  );

  if (!video.urls) {
    throw new Error('urls are not defined.');
  }
  const urls = video.urls;

  // add the video-js class name to the video attribute.
  videoNode.classList.add('video-js', 'vjs-big-play-centered');

  const sources: VideoJsExtendedSourceObject[] = [];
  const plugins: VideoJsPlayerPluginOptions = {};

  if (!isMSESupported()) {
    plugins.qualitySelector = {
      default: '480',
    };
    Object.keys(urls.mp4)
      .map((size) => Number(size) as videoSize)
      .sort((a, b) => b - a)
      .forEach((size) => {
        sources.push({
          type: 'video/mp4',
          src: urls.mp4[size] ?? '',
          size: size.toString(),
        });
      });
  } else {
    sources.push({
      type: 'application/x-mpegURL',
      src: urls.manifests.hls,
    });
  }

  const options: VideoJsPlayerOptions = {
    autoplay: video.is_live,
    controls: true,
    controlBar: {
      audioTrackButton: false,
    },
    debug: false,
    fluid: true,
    html5: {
      vhs: {
        // prevent to have a resolution selected higher than
        // the player size. By default this is set to true.
        // We set it to true here to remember this undocumented option.
        limitRenditionByPlayerDimensions: true,
        overrideNative: !videojs.browser.IS_SAFARI,
        // take the device pixel ratio into account when doing rendition switching.
        // This means that if you have a player with the width of 540px in a high density
        // display with a device pixel ratio of 2, a rendition of 1080p will be allowed.
        useDevicePixelRatio: true,
      },
      nativeAudioTracks: videojs.browser.IS_SAFARI,
      nativeVideoTracks: videojs.browser.IS_SAFARI,
    },
    language: locale,
    liveui: video.is_live,
    playbackRates: video.is_live ? [] : [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4],
    plugins,
    responsive: true,
    sources,
  };

  const player = videojs(videoNode, options, function () {
    if (video.is_live) {
      this.play();
    }
    onReady?.(this);
  });

  if (isMSESupported()) {
    if (isP2pQueryEnabled && isP2PEnabled) {
      player.p2pHlsPlugin();
    }
    if (!video.is_live && video.urls.mp4) {
      player.downloadVideoPlugin({ urls: video.urls.mp4 });
    }
    if (video.shared_live_medias && video.shared_live_medias.length) {
      player.sharedMediaPlugin({
        sharedLiveMedias: video.shared_live_medias,
      });
    }
    player.httpSourceSelector();
  }
  player.id3Plugin();
  player.xapiPlugin({ video, locale, dispatchPlayerTimeUpdate });

  const unsubscribeTranscriptTimeSelector = useTranscriptTimeSelector.subscribe(
    (state) => state.time,
    (time) => player.currentTime(time),
  );

  // When the player is dispose, unsubscribe to the useTranscriptTimeSelector store.
  player.on('dispose', () => {
    unsubscribeTranscriptTimeSelector();
  });

  return player;
};

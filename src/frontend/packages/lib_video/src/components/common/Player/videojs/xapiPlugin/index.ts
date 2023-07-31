import { Maybe, Nullable } from '@lib-common/types';
import {
  InteractedContextExtensions,
  Video,
  VideoXAPIStatementInterface,
  XAPIStatement,
  liveState,
  report,
  useCurrentSession,
  useJwt,
} from 'lib-components';
import videojs from 'video.js';

import { pushAttendance } from '@lib-video/api/pushAttendance';
import { useAttendance } from '@lib-video/hooks/useAttendance';
import { QualityLevels } from '@lib-video/types/libs/video.js/extend';
import { getOrInitAnonymousId } from '@lib-video/utils/getOrInitAnonymousId';
import { isMSESupported } from '@lib-video/utils/isMSESupported';

import { Events } from '../qualitySelectorPlugin/types';

import { XapiPluginOptions } from './types';

const Plugin = videojs.getPlugin('plugin');

export class xapiPlugin extends Plugin {
  private xapiStatement: VideoXAPIStatementInterface;
  video: Video;
  currentTime: number;
  seekingAt: number;
  hasSeeked: boolean;
  isInitialized: boolean;
  interval: number | undefined;
  hasAttendance: boolean;
  currentTrack: Nullable<TextTrack>;
  locale: Maybe<string>;

  constructor(player: videojs.Player, options: XapiPluginOptions) {
    super(player, options);

    this.video = options.video;
    this.player = player;
    this.currentTime = 0;
    this.seekingAt = 0;
    this.hasSeeked = false;
    this.isInitialized = false;
    this.hasAttendance =
      this.video.live_state === liveState.RUNNING &&
      this.video.can_edit === false;
    this.currentTrack = this.getCurrentTrack();
    this.locale = options.locale;

    const { jwt } = useJwt.getState();
    const sessionId = useCurrentSession.getState().sessionId;
    if (!jwt) {
      throw new Error('Authenticated jwt is required.');
    }
    try {
      this.xapiStatement = XAPIStatement(jwt, sessionId, options.video);
    } catch (error) {
      report(error);
      throw error;
    }

    if (isMSESupported()) {
      const qualityLevels = player.qualityLevels();
      qualityLevels.on('change', () => this.interacted(qualityLevels));
    } else {
      player.on(Events.PLAYER_SOURCES_CHANGED, () => this.interacted());
    }

    /************************** EVENT BINDINGS **************************/

    player.on('canplaythrough', this.initialize.bind(this));
    player.on('play', () => {
      this.xapiStatement.played({
        time: player.currentTime(),
      });
    });
    player.on('pause', () => {
      this.xapiStatement.paused({
        time: player.currentTime(),
      });
    });

    player.on('timeupdate', () => {
      if (this.isInitialized && !player.seeking()) {
        this.currentTime = player.currentTime();
      }
      options.dispatchPlayerTimeUpdate(player.currentTime());
    });

    player.on('seeking', () => {
      this.seekingAt = this.currentTime;
      this.hasSeeked = true;
    });

    player.on('seeked', () => {
      if (!this.hasSeeked) {
        return;
      }
      this.hasSeeked = false;
      this.xapiStatement.seeked({
        timeFrom: this.seekingAt,
        timeTo: player.currentTime(),
      });
    });
    player.on('fullscreenchange', this.interacted.bind(this));
    player.on('languagechange', this.interacted.bind(this));
    player.on('ratechange', this.interacted.bind(this));
    player.on('volumechange', this.interacted.bind(this));
    const tracks = player.remoteTextTracks();
    tracks.addEventListener('change', () => {
      this.currentTrack = this.getCurrentTrack();
      this.interacted();
    });

    /**************** End interacted event *************************/

    window.addEventListener('unload', () => {
      if (!this.isInitialized) {
        return;
      }

      this.xapiStatement.terminated({ time: player.currentTime() });

      if (this.interval) {
        player.clearInterval(this.interval);
      }
    });
  }

  private trackAttendance() {
    const attendance = {
      [Math.round(Date.now() / 1000)]: {
        fullScreen: this.player.isFullscreen(),
        muted: this.player.muted(),
        player_timer: this.player.currentTime(),
        playing: !this.player.paused(),
        timestamp: Date.now(),
        volume: this.player.volume(),
      },
    };
    if (!this.locale) {
      throw new Error('Locale is undefined.');
    }
    const anonymousId = getOrInitAnonymousId();
    pushAttendance(this.video.id, attendance, this.locale, anonymousId);
  }

  private getCurrentTrack() {
    const tracks = this.player.remoteTextTracks();
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].mode === 'showing') {
        return tracks[i];
      }
    }
    return null;
  }

  private initialize() {
    if (this.isInitialized) {
      return;
    }
    const contextExtensions = {
      ccSubtitleEnabled: this.currentTrack !== null,
      fullScreen: this.player.isFullscreen(),
      length: this.player.duration(),
      speed: `${this.player.playbackRate()}x`,
      volume: this.player.volume(),
    };
    this.xapiStatement.initialized(contextExtensions);
    this.isInitialized = true;
    if (this.hasAttendance) {
      const delay = useAttendance.getState().delay;
      this.interval = this.player.setInterval(
        () => this.trackAttendance(),
        delay,
      );
    }
  }

  private interacted(qualityLevels?: QualityLevels) {
    if (!this.isInitialized) {
      // For a live video, no event to detect when the video is fully initialized is triggered
      // before the first "play" action. To mitigate this, we can call "initialize"
      // on the first "interact" action and we don't log this interaction. The first interact
      // action is when the first quality to play is chosen, the default one. To choose it,
      // all quality available must be read in the HLS manifest. So we can consider at this
      // time that the video is initialized.
      if (this.video.is_live) {
        this.initialize();
      }
      return;
    }
    let quality: string | number | undefined;

    if (qualityLevels) {
      quality = qualityLevels[qualityLevels.selectedIndex]?.height;
    } else {
      quality = this.player.currentSource().size;
    }

    const contextExtensions: InteractedContextExtensions = {
      ccSubtitleEnabled: this.getCurrentTrack() !== null,
      fullScreen: this.player.isFullscreen(),
      quality,
      speed: `${this.player.playbackRate()}x`,
      volume: this.player.volume(),
    };

    const currentTrack = this.getCurrentTrack();
    if (currentTrack !== null) {
      contextExtensions.ccSubtitleLanguage = currentTrack.language;
    }

    this.xapiStatement.interacted(
      { time: this.player.currentTime() },
      contextExtensions,
    );
  }
}

videojs.registerPlugin('xapiPlugin', xapiPlugin);

import { Box } from 'grommet';
import { Maybe, Nullable } from 'lib-common';
import {
  TimedText,
  Video,
  timedTextMode,
  useThumbnail,
  videoSize,
} from 'lib-components';
import React, { useEffect, useMemo, useRef } from 'react';
import { useIntl } from 'react-intl';
import { useQueryClient } from 'react-query';
import styled from 'styled-components';

import { useTimedTextMetadata } from '@lib-video/api/useTimedTextMetadata';
import { createPlayer } from '@lib-video/components/common/Player/createPlayer';
import { MissingVideoUrlsException } from '@lib-video/errors';
import { useVideoProgress } from '@lib-video/hooks/useVideoProgress';
import { VideoPlayerInterface } from '@lib-video/types/VideoPlayer';

interface BaseVideoPlayerProps {
  video: Video;
  playerType: string;
  timedTextTracks: TimedText[];
  defaultVolume?: number;
}

export const StyledBox = styled(Box)`
  /* 
    This make the control bar visible when the video
    has not been played yet.
  */
  .video-js .vjs-menu-button-inline.vjs-slider-active,
  .video-js .vjs-menu-button-inline:focus,
  .video-js .vjs-menu-button-inline:hover,
  .video-js.vjs-no-flex .vjs-menu-button-inline {
    width: 10em;
  }

  .video-js .vjs-controls-disabled .vjs-big-play-button {
    display: none !important;
  }

  .video-js .vjs-control {
    width: 3em;
  }

  .video-js .vjs-menu-button-inline:before {
  }

  .vjs-menu-button-inline .vjs-menu {
    left: 3em;
  }

  .vjs-paused.vjs-has-started.video-js .vjs-big-play-button,
  .video-js.vjs-ended .vjs-big-play-button,
  .video-js.vjs-paused .vjs-big-play-button {
    display: block;
  }

  .video-js .vjs-load-progress div,
  .vjs-seeking .vjs-big-play-button,
  .vjs-waiting .vjs-big-play-button {
    display: none !important;
  }

  .video-js .vjs-mouse-display:after,
  .video-js .vjs-play-progress:after {
    padding: 0 0.4em 0.3em !important;
  }

  .video-js.vjs-ended .vjs-loading-spinner {
    display: none;
  }

  .video-js.vjs-ended .vjs-big-play-button {
    display: block !important;
  }

  .video-js *,
  .video-js:after,
  .video-js:before {
    box-sizing: inherit;
    font-size: inherit;
    color: inherit;
    line-height: inherit;
  }

  .video-js.vjs-fullscreen,
  .video-js.vjs-fullscreen .vjs-tech {
    width: 100% !important;
    height: 100% !important;
  }

  .video-js {
    font-size: 14px;
    overflow: hidden;
  }

  .video-js .vjs-control {
    color: inherit;
  }

  .video-js .vjs-menu-button-inline:hover,
  .video-js.vjs-no-flex .vjs-menu-button-inline {
  }

  .video-js
    .vjs-volume-menu-button.vjs-volume-menu-button-horizontal:hover
    .vjs-menu
    .vjs-menu-content {
    height: 3em;
  }

  .video-js .vjs-control:focus:before,
  .video-js .vjs-control:hover:before {
    text-shadow: 0 0 1em #fff, 0 0 1em #fff, 0 0 1em #fff;
  }

  .video-js .vjs-spacer,
  .video-js .vjs-time-control {
    display: -webkit-box;
    display: -moz-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
    -webkit-box-flex: 1 1 auto;
    -moz-box-flex: 1 1 auto;
    -webkit-flex: 1 1 auto;
    -ms-flex: 1 1 auto;
    flex: 1 1 auto;
  }

  .video-js .vjs-time-control {
    -webkit-box-flex: 0 1 auto;
    -moz-box-flex: 0 1 auto;
    -webkit-flex: 0 1 auto;
    -ms-flex: 0 1 auto;
    flex: 0 1 auto;
    width: auto;
    align-items: center;
  }

  .video-js .vjs-time-control.vjs-time-divider {
    width: 10px;
  }

  .video-js .vjs-time-control.vjs-time-divider div {
    width: 100%;
    text-align: center;
  }

  .video-js .vjs-time-control.vjs-current-time {
    margin-left: 0em;
  }

  .video-js .vjs-time-control .vjs-current-time-display,
  .video-js .vjs-time-control .vjs-duration-display {
    width: 100%;
  }

  .video-js .vjs-time-control .vjs-current-time-display {
    text-align: right;
  }

  .video-js .vjs-time-control .vjs-duration-display {
    text-align: left;
  }

  .video-js .vjs-play-progress:before,
  .video-js .vjs-progress-control .vjs-play-progress:before,
  .video-js .vjs-remaining-time,
  .video-js .vjs-volume-level:after,
  .video-js .vjs-volume-level:before,
  .video-js.vjs-live .vjs-time-control.vjs-current-time,
  .video-js.vjs-live .vjs-time-control.vjs-duration,
  .video-js.vjs-live .vjs-time-control.vjs-time-divider,
  .video-js.vjs-no-flex .vjs-time-control.vjs-remaining-time {
    display: none;
  }

  .video-js.vjs-no-flex .vjs-time-control {
    display: table-cell;
    width: 4em;
  }

  .video-js .vjs-progress-control {
    position: absolute;
    left: 0;
    right: 0;
    width: 100%;
    height: 0.5em;
    top: -0.5em;
  }

  .video-js .vjs-progress-control .vjs-load-progress,
  .video-js .vjs-progress-control .vjs-play-progress,
  .video-js .vjs-progress-control .vjs-progress-holder {
    height: 100%;
  }

  .video-js .vjs-progress-control .vjs-progress-holder {
    margin: 0;
  }

  .video-js .vjs-progress-control:hover {
    height: 1.5em;
    top: -1.5em;
  }

  .video-js .vjs-control-bar {
    -webkit-transition: -webkit-transform 0.1s ease 0s;
    -moz-transition: -moz-transform 0.1s ease 0s;
    -ms-transition: -ms-transform 0.1s ease 0s;
    -o-transition: -o-transform 0.1s ease 0s;
    transition: transform 0.1s ease 0s;
  }

  .video-js.not-hover.vjs-has-started.vjs-paused.vjs-user-active
    .vjs-control-bar,
  .video-js.not-hover.vjs-has-started.vjs-paused.vjs-user-inactive
    .vjs-control-bar,
  .video-js.not-hover.vjs-has-started.vjs-playing.vjs-user-active
    .vjs-control-bar,
  .video-js.not-hover.vjs-has-started.vjs-playing.vjs-user-inactive
    .vjs-control-bar,
  .video-js.vjs-has-started.vjs-playing.vjs-user-inactive .vjs-control-bar {
    visibility: visible;
    opacity: 1;
    -webkit-backface-visibility: hidden;
    -webkit-transform: translateY(3em);
    -moz-transform: translateY(3em);
    -ms-transform: translateY(3em);
    -o-transform: translateY(3em);
    transform: translateY(3em);
    -webkit-transition: -webkit-transform 0.4s ease 0s;
    -moz-transition: -moz-transform 0.4s ease 0s;
    -ms-transition: -ms-transform 0.4s ease 0s;
    -o-transition: -o-transform 0.4s ease 0s;
    transition: transform 0.4s ease 0s;
  }

  .video-js.not-hover.vjs-has-started.vjs-paused.vjs-user-active
    .vjs-progress-control,
  .video-js.not-hover.vjs-has-started.vjs-paused.vjs-user-inactive
    .vjs-progress-control,
  .video-js.not-hover.vjs-has-started.vjs-playing.vjs-user-active
    .vjs-progress-control,
  .video-js.not-hover.vjs-has-started.vjs-playing.vjs-user-inactive
    .vjs-progress-control,
  .video-js.vjs-has-started.vjs-playing.vjs-user-inactive
    .vjs-progress-control {
    height: 0.25em;
    top: -0.25em;
    pointer-events: none;
    -webkit-transition: height 0.4s, top 0.4s;
    -moz-transition: height 0.4s, top 0.4s;
    -ms-transition: height 0.4s, top 0.4s;
    -o-transition: height 0.4s, top 0.4s;
    transition: height 0.4s, top 0.4s;
  }

  .video-js.not-hover.vjs-has-started.vjs-paused.vjs-user-active.vjs-fullscreen
    .vjs-progress-control,
  .video-js.not-hover.vjs-has-started.vjs-paused.vjs-user-inactive.vjs-fullscreen
    .vjs-progress-control,
  .video-js.not-hover.vjs-has-started.vjs-playing.vjs-user-active.vjs-fullscreen
    .vjs-progress-control,
  .video-js.not-hover.vjs-has-started.vjs-playing.vjs-user-inactive.vjs-fullscreen
    .vjs-progress-control,
  .video-js.vjs-has-started.vjs-playing.vjs-user-inactive.vjs-fullscreen
    .vjs-progress-control {
    opacity: 0;
    -webkit-transition: opacity 0.4s ease 0.4s;
    -moz-transition: opacity 0.4s ease 0.4s;
    -ms-transition: opacity 0.4s ease 0.4s;
    -o-transition: opacity 0.4s ease 0.4s;
    transition: opacity 0.4s ease 0.4s;
  }

  .video-js.vjs-live .vjs-live-control {
    margin-left: 1em;
  }

  .video-js .vjs-big-play-button {
    top: 50%;
    left: 50%;
    margin-left: -1em;
    margin-top: -1em;
    width: 2em;
    height: 2em;
    line-height: 2em;
    border: none;
    border-radius: 50%;
    font-size: 3.5em;
    background-color: rgba(0, 0, 0, 0.45);
    color: #fff;
    -webkit-transition: border-color 0.4s, outline 0.4s, background-color 0.4s;
    -moz-transition: border-color 0.4s, outline 0.4s, background-color 0.4s;
    -ms-transition: border-color 0.4s, outline 0.4s, background-color 0.4s;
    -o-transition: border-color 0.4s, outline 0.4s, background-color 0.4s;
    transition: border-color 0.4s, outline 0.4s, background-color 0.4s;
  }

  .video-js .vjs-menu-button-popup .vjs-menu {
  }

  .video-js .vjs-menu-button-popup .vjs-menu .vjs-menu-content {
    background-color: transparent;
    left: -1.5em;
    padding-bottom: 0.5em;
  }

  .video-js .vjs-menu-button-popup .vjs-menu .vjs-menu-item,
  .video-js .vjs-menu-button-popup .vjs-menu .vjs-menu-title {
    background-color: rgba(0, 0, 10, 0.24) !important;
  }

  .video-js .vjs-menu-button-popup .vjs-menu .vjs-menu-item.vjs-selected {
    background-color: #2483d5;
  }

  .video-js .vjs-big-play-button {
    background-color: rgba(12, 60, 139, 0.81);
    font-size: 3.5em;
    border-radius: 26%;
    height: 2em !important;
    line-height: 2em !important;
    margin-top: -1em !important;
  }

  .video-js:hover .vjs-big-play-button,
  .video-js .vjs-big-play-button:focus,
  .video-js .vjs-big-play-button:active {
    background-color: rgba(0, 95, 218, 0.62);
  }

  .video-js .vjs-loading-spinner {
    border-color: #000000;
  }

  .video-js .vjs-control-bar2 {
    background-color: transparent;
  }

  .video-js .vjs-control-bar {
    background-color: rgba(0, 0, 10, 0.24);
    color: #ffffff;
    font-size: 13px;
  }

  .video-js .vjs-play-progress,
  .video-js .vjs-volume-level {
    background-color: #2483d5;
  }

  .vjs-playback-rate-value {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .vjs-control-bar {
    display: flex;
  }

  .vjs-icon-download {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="white" d="M16.59,10 L15,10 L15,5 C15,4.45 14.55,4 14,4 L10,4 C9.45,4 9,4.45 9,5 L9,10 L7.41,10 C6.52,10 6.07,11.08 6.7,11.71 L11.29,16.3 C11.68,16.69 12.31,16.69 12.7,16.3 L17.29,11.71 C17.92,11.08 17.48,10 16.59,10 Z M5,20 C5,20.55 5.45,21 6,21 L18,21 C18.55,21 19,20.55 19,20 C19,19.45 18.55,19 18,19 L6,19 C5.45,19 5,19.45 5,20 Z" /></svg>');
    background-repeat: no-repeat;
    background-position: center;
    fill: white;
  }
`;

export const VideoPlayer = ({
  video,
  playerType,
  timedTextTracks,
  defaultVolume,
}: BaseVideoPlayerProps) => {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const videoNodeRef = useRef<Nullable<HTMLVideoElement>>(null);
  const containerVideoRef = useRef<HTMLDivElement>(null);
  const localeRef = useRef(intl.locale);
  const propsRef = useRef({
    video,
    playerType,
    defaultVolume,
    timedTextTracks,
  });

  const { data } = useTimedTextMetadata(video.id);
  const choices = useMemo(
    () =>
      data?.actions.POST.language.choices?.map((choice) => ({
        label: choice.display_name,
        value: choice.value,
      })),
    [data?.actions.POST.language.choices],
  );
  const thumbnail = useThumbnail((state) => state.getThumbnail());

  const setPlayerCurrentTime = useVideoProgress(
    (state) => state.setPlayerCurrentTime,
  );

  const languages: { [key: string]: string } = useMemo(() => {
    if (choices) {
      return choices.reduce(
        (acc, current) => ({
          ...acc,
          [current.value]: current.label,
        }),
        {},
      );
    }

    return {};
  }, [choices]);
  const languagesRef = useRef(languages);
  const playerRef = useRef<Maybe<VideoPlayerInterface>>(undefined);

  /**
   * Initialize the video player.
   * Noop out if the video is missing, render will redirect to an error page.
   */
  useEffect(() => {
    if (propsRef.current.video && videoNodeRef.current) {
      // Instantiate the player and keep the instance in state
      playerRef.current = createPlayer(
        propsRef.current.playerType,
        videoNodeRef.current,
        setPlayerCurrentTime,
        propsRef.current.video,
        localeRef.current,
        (videoPlayer) => {
          if (propsRef.current.defaultVolume !== undefined) {
            videoPlayer.volume(
              Math.min(1, Math.max(0, propsRef.current.defaultVolume)),
            );
          }

          propsRef.current.timedTextTracks
            .filter((track) => track.is_ready_to_show)
            .filter((track) =>
              [
                timedTextMode.CLOSED_CAPTIONING,
                timedTextMode.SUBTITLE,
              ].includes(track.mode),
            )
            .forEach((track) => {
              if (playerRef.current) {
                playerRef.current.addTrack(track, languagesRef.current);
              }
            });
        },
      );
    }

    /** Make sure to destroy the player on unmount. */
    return () => playerRef.current && playerRef.current.destroy();
  }, [setPlayerCurrentTime]);

  useEffect(() => {
    if (video?.urls?.manifests?.hls && playerRef.current) {
      playerRef.current.setSource(video.urls.manifests.hls);
    }
  }, [video?.urls?.manifests?.hls]);

  const oldTimedTextTracks = useRef(timedTextTracks);
  useEffect(() => {
    if (!playerRef.current) {
      return;
    }
    const playerApi = playerRef.current;

    // tracks to add
    timedTextTracks
      .filter(
        (track) =>
          !oldTimedTextTracks.current.includes(track) &&
          track.is_ready_to_show &&
          [timedTextMode.CLOSED_CAPTIONING, timedTextMode.SUBTITLE].includes(
            track.mode,
          ),
      )
      .forEach((track) => playerApi.addTrack(track, languages));
    // tracks to remove
    oldTimedTextTracks.current
      .filter(
        (track) =>
          !timedTextTracks.includes(track) &&
          track.is_ready_to_show &&
          [timedTextMode.CLOSED_CAPTIONING, timedTextMode.SUBTITLE].includes(
            track.mode,
          ),
      )
      .forEach((track) => playerApi.removeTrack(track));

    oldTimedTextTracks.current = timedTextTracks;
  }, [languages, timedTextTracks]);

  const resolutions = useMemo(() => {
    if (video?.urls?.mp4) {
      const tmpResolutions = Object.keys(video.urls.mp4).map(
        (size) => Number(size) as videoSize,
      );
      tmpResolutions.sort((a, b) => b - a);

      return tmpResolutions;
    }

    return [];
  }, [video?.urls?.mp4]);

  // The video is somehow missing and jwt must be set
  if (!video.urls) {
    throw new MissingVideoUrlsException('Urls are missing in the video.');
  }
  const urls = video.urls;

  /**
   * Thumbnail store is not associated to a video, so we need to refresh the
   * video if a thumbnail is deleted in the store to get the correct new thumbnail.
   */
  useEffect(() => {
    if (!thumbnail && video.thumbnail) {
      (async () => await queryClient.resetQueries(['videos', video.id]))();
    }
  }, [queryClient, thumbnail, video.id, video.thumbnail]);

  const thumbnailUrl = useMemo(() => {
    const thumbnailUrls =
      (thumbnail && thumbnail.is_ready_to_show && thumbnail.urls) ||
      video.urls?.thumbnails;

    const thumbnailUrl = thumbnailUrls && thumbnailUrls[resolutions[0]];

    if (containerVideoRef.current) {
      containerVideoRef.current
        .querySelector('.vjs-poster')
        ?.setAttribute(
          'style',
          thumbnailUrl ? `background-image: url(${thumbnailUrl});` : ``,
        );
    }

    return thumbnailUrl;
  }, [resolutions, thumbnail, video.urls?.thumbnails]);

  return (
    <StyledBox ref={containerVideoRef}>
      <video
        ref={videoNodeRef}
        crossOrigin="anonymous"
        poster={thumbnailUrl}
        /* tabIndex is set to -1 to not take focus on this element when a user is navigating using
       their keyboard. */
        tabIndex={-1}
        playsInline
      >
        {resolutions.map((size, index) => (
          <source
            key={`url_${index}`}
            sizes={`${size}`}
            src={urls.mp4[size]}
            type="video/mp4"
          />
        ))}
      </video>
    </StyledBox>
  );
};

import { useQueryClient } from '@tanstack/react-query';
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
  .vjs-control-bar {
    display: flex;
  }

  .vjs-icon-download {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="white" d="M16.59,10 L15,10 L15,5 C15,4.45 14.55,4 14,4 L10,4 C9.45,4 9,4.45 9,5 L9,10 L7.41,10 C6.52,10 6.07,11.08 6.7,11.71 L11.29,16.3 C11.68,16.69 12.31,16.69 12.7,16.3 L17.29,11.71 C17.92,11.08 17.48,10 16.59,10 Z M5,20 C5,20.55 5.45,21 6,21 L18,21 C18.55,21 19,20.55 19,20 C19,19.45 18.55,19 18,19 L6,19 C5.45,19 5,19.45 5,20 Z" /></svg>');
    background-repeat: no-repeat;
    background-position: center;
    fill: white;
  }
  
  .vjs-icon-shared-media {
    background-image: url('data:image/svg+xml; utf8,
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
        <g transform="matrix(1,0,0,1,-0.000751991,0.192179)">
            <g transform="matrix(1.04348,0,0,1.24599,-1.04273,-0.718417)">
                <path d="M24,1.803L24,3.197C24,3.64 23.57,4 23.041,4L1.959,4C1.43,4 1,3.64 1,3.197L1,1.803C1,1.36 1.43,1 1.959,1L23.041,1C23.57,1 24,1.36 24,1.803ZM2.198,2.003L2.198,2.997L22.802,2.997L22.802,2.003L2.198,2.003Z"/>
            </g>
            <g transform="matrix(0.915598,0,0,4.95896,0.555022,-1.95118)">
                <path d="M24,1.121L24,3.879C24,3.946 23.706,4 23.345,4L1.655,4C1.294,4 1,3.946 1,3.879L1,1.121C1,1.054 1.294,1 1.655,1L23.345,1C23.706,1 24,1.054 24,1.121ZM2.365,1.252L2.365,3.748L22.635,3.748L22.635,1.252L2.365,1.252Z"/>
            </g>
            <g transform="matrix(1,0,0,1,3.55271e-15,-0.536933)">
                <path d="M10,23.625C9.655,23.625 9.375,23.345 9.375,23C9.375,22.655 9.655,22.375 10,22.375L14,22.375C14.345,22.375 14.625,22.655 14.625,23C14.625,23.345 14.345,23.625 14,23.625L10,23.625Z"/>
            </g>
            <g transform="matrix(3.68716,0,0,1,-32.2422,-16.1143)">
                <path d="M10,23.625C9.906,23.625 9.83,23.345 9.83,23C9.83,22.655 9.906,22.375 10,22.375L14,22.375C14.094,22.375 14.17,22.655 14.17,23C14.17,23.345 14.094,23.625 14,23.625L10,23.625Z"/>
            </g>
            <g transform="matrix(3.68716,0,0,1,-32.2422,-13.1367)">
                <path d="M10,23.625C9.906,23.625 9.83,23.345 9.83,23C9.83,22.655 9.906,22.375 10,22.375L14,22.375C14.094,22.375 14.17,22.655 14.17,23C14.17,23.345 14.094,23.625 14,23.625L10,23.625Z"/>
            </g>
            <g transform="matrix(2.1725,0,0,1,-17.0956,-10.1591)">
                <path d="M10,23.625C9.841,23.625 9.712,23.345 9.712,23C9.712,22.655 9.841,22.375 10,22.375L14,22.375C14.159,22.375 14.288,22.655 14.288,23C14.288,23.345 14.159,23.625 14,23.625L10,23.625Z"/>
            </g>
            <g transform="matrix(7.39088e-17,1.45702,-1,7.90757e-17,35,2.06476)">
                <rect x="10" y="22.375" width="4" height="1.25"/>
            </g>
        </g>
      </svg>
    ');
    background-repeat: no-repeat;
    background-position: center;
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

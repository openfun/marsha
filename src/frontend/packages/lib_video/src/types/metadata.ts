import {
  Resource,
  SharedLiveMedia,
  Thumbnail,
  TimedText,
  Video,
} from 'lib-components';

import { RouteOptions } from './RouteOptions';

export interface ResourceMetadata<T extends Resource> {
  name: string;
  description: string;
  renders: string[];
  parses: string[];
  actions: RouteOptions<T>['actions'];
}

export interface VideoMetadata extends ResourceMetadata<Video> {
  live: {
    segment_duration_seconds: number;
  };
  vod: {
    upload_max_size_bytes: number;
  };
}

export interface TimedTextMetadata extends ResourceMetadata<TimedText> {
  upload_max_size_bytes: number;
}

export interface ThumbnailMetadata extends ResourceMetadata<Thumbnail> {
  upload_max_size_bytes: number;
}

export interface SharedLiveMediaMetadata
  extends ResourceMetadata<SharedLiveMedia> {
  upload_max_size_bytes: number;
}

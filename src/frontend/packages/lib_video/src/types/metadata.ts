import { Resource, TimedText, Video } from 'lib-components';

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
}

export type TimedTextMetadata = ResourceMetadata<TimedText>;

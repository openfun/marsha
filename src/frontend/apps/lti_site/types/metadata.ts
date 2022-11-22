import { RouteOptions } from './RouteOptions';
import { Resource, TimedText, Video } from 'lib-components';

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

export interface TimedTextMetadata extends ResourceMetadata<TimedText> {}
